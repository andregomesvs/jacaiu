// app/app/(tabs)/lista.js
// Tela de lista de jogadores monitorados

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Image, Modal, Alert, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, getPlayers, addPlayer, removePlayer } from '../../../backend/supabaseClient';
import { useRouter } from 'expo-router';

const PLATFORM_CONFIG = {
  steam:     { label: 'Steam (CS2)',  icon: '🛡️', color: '#66C0F4' },
  faceit:    { label: 'FACEIT',       icon: '⚡',  color: '#FF5500' },
  gamerclub: { label: 'Gamer Club',   icon: '🎮',  color: '#00C9A7' },
};

export default function ListaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos'); // todos | limpos | banidos
  const [addOpen, setAddOpen] = useState(false);
  const [steamInput, setSteamInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      loadPlayers(user.id);
    });
  }, []);

  async function loadPlayers(userId) {
    const { data } = await getPlayers(userId);
    if (data) setPlayers(data);
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    if (user) loadPlayers(user.id);
  };

  async function handleAdd() {
    if (!steamInput.trim()) return;
    setAdding(true);
    setAddError('');
    const { data, error } = await addPlayer(user.id, steamInput.trim());
    if (error) {
      setAddError(error.message.includes('duplicate')
        ? 'Jogador já está na lista!'
        : 'Erro ao adicionar. Verifique o ID/URL.');
    } else {
      setPlayers(prev => [{ ...data, bans: [] }, ...prev]);
      setSteamInput('');
      setAddOpen(false);
    }
    setAdding(false);
  }

  function confirmRemove(player) {
    Alert.alert(
      'Remover jogador',
      `Deseja remover ${player.display_name} da sua lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await removePlayer(player.id);
            setPlayers(prev => prev.filter(p => p.id !== player.id));
            setSelectedPlayer(null);
          }
        }
      ]
    );
  }

  const filtered = players.filter(p => {
    const matchSearch = p.display_name.toLowerCase().includes(search.toLowerCase())
      || p.steam_id.toLowerCase().includes(search.toLowerCase());
    if (filter === 'banidos') return matchSearch && p.is_banned;
    if (filter === 'limpos') return matchSearch && !p.is_banned;
    return matchSearch;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header fixo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Lista</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Text style={styles.addBtnText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar jogador..."
          placeholderTextColor="#333"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {['todos', 'limpos', 'banidos'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'todos' ? 'Todos' : f === 'limpos' ? '✅ Limpos' : '🚨 Banidos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF87" />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyTitle}>Nenhum jogador encontrado</Text>
            <Text style={styles.emptySub}>Adicione jogadores para monitorar</Text>
          </View>
        ) : (
          filtered.map(player => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                { borderColor: player.is_banned ? '#FF3D5540' : '#00FF8725' }
              ]}
              onPress={() => setSelectedPlayer(player)}
              activeOpacity={0.7}
            >
              {/* Avatar + status dot */}
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: player.avatar_url || 'https://via.placeholder.com/44' }}
                  style={styles.playerAvatar}
                />
                <View style={[
                  styles.statusDot,
                  { backgroundColor: player.is_banned ? '#FF3D57' : '#00FF87' }
                ]} />
              </View>

              {/* Info */}
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.display_name}</Text>
                <Text style={styles.playerSteam} numberOfLines={1}>{player.steam_id}</Text>
                <Text style={styles.playerDate}>Adicionado {player.added_at
                  ? new Date(player.added_at).toLocaleDateString('pt-BR')
                  : ''}</Text>
              </View>

              {/* Ban tags ou limpo */}
              <View style={styles.playerRight}>
                {player.is_banned && player.bans?.length > 0 ? (
                  player.bans.slice(0, 2).map((b, i) => {
                    const cfg = PLATFORM_CONFIG[b.platform] || {};
                    return (
                      <View key={i} style={[styles.banTag, { borderColor: cfg.color + '66' }]}>
                        <Text style={[styles.banTagText, { color: cfg.color }]}>{cfg.icon}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.cleanLabel}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal: Detalhe do jogador */}
      <Modal
        visible={!!selectedPlayer}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {selectedPlayer && (
              <>
                <Image
                  source={{ uri: selectedPlayer.avatar_url || 'https://via.placeholder.com/72' }}
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalName}>{selectedPlayer.display_name}</Text>
                <Text style={styles.modalSteam}>{selectedPlayer.steam_id}</Text>

                <View style={styles.modalStatus}>
                  {!selectedPlayer.is_banned ? (
                    <View style={styles.cleanBadge}>
                      <Text style={styles.cleanBadgeText}>✓ Sem bans detectados</Text>
                    </View>
                  ) : (
                    (selectedPlayer.bans || []).map((b, i) => {
                      const cfg = PLATFORM_CONFIG[b.platform] || {};
                      return (
                        <View key={i} style={[styles.modalBanRow, { borderColor: '#FF3D5730' }]}>
                          <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.modalBanPlatform}>{cfg.label}</Text>
                            <Text style={styles.modalBanType}>{b.ban_type}</Text>
                          </View>
                          <Text style={styles.modalBanDate}>
                            {new Date(b.detected_at).toLocaleDateString('pt-BR')}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => confirmRemove(selectedPlayer)}
                >
                  <Text style={styles.removeBtnText}>🗑 Remover da lista</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedPlayer(null)}
                >
                  <Text style={styles.closeBtnText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Adicionar jogador */}
      <Modal
        visible={addOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalName}>Adicionar jogador</Text>
            <Text style={styles.modalSteam}>Cole o link do perfil ou ID Steam</Text>

            <TextInput
              style={styles.addInput}
              placeholder={'https://steamcommunity.com/id/username\nou STEAM_0:0:12345678'}
              placeholderTextColor="#333"
              value={steamInput}
              onChangeText={setSteamInput}
              multiline
            />

            {addError ? (
              <Text style={styles.addError}>{addError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.addConfirmBtn, adding && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={adding}
            >
              <Text style={styles.addConfirmText}>
                {adding ? 'Adicionando...' : 'Adicionar e monitorar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setAddOpen(false)}>
              <Text style={styles.closeBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'SpaceMono' },
  addBtn: {
    backgroundColor: '#00FF87',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#000', fontSize: 12, fontWeight: '700', fontFamily: 'SpaceMono' },

  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ddd',
    fontSize: 13,
    fontFamily: 'SpaceMono',
  },

  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#111',
  },
  filterBtnActive: { borderColor: '#00FF87', backgroundColor: '#00FF8715' },
  filterText: { fontSize: 11, color: '#555', fontFamily: 'SpaceMono' },
  filterTextActive: { color: '#00FF87' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  loadingText: { color: '#333', textAlign: 'center', marginTop: 40, fontFamily: 'SpaceMono' },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 32, color: '#222' },
  emptyTitle: { fontSize: 15, color: '#444', fontFamily: 'SpaceMono' },
  emptySub: { fontSize: 12, color: '#333', fontFamily: 'SpaceMono' },

  playerCard: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarWrap: { position: 'relative' },
  playerAvatar: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#222' },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
    position: 'absolute', bottom: -1, right: -1,
    borderWidth: 2, borderColor: '#111',
  },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 13, fontWeight: '700', color: '#ddd', fontFamily: 'SpaceMono' },
  playerSteam: { fontSize: 10, color: '#444', marginTop: 2, fontFamily: 'SpaceMono' },
  playerDate: { fontSize: 10, color: '#333', marginTop: 1, fontFamily: 'SpaceMono' },
  playerRight: { alignItems: 'flex-end', gap: 4 },
  banTag: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: '#1A1A1A',
  },
  banTagText: { fontSize: 12 },
  cleanLabel: { fontSize: 14, color: '#00FF87' },

  // Modais
  modalOverlay: {
    flex: 1, backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#222',
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 10,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#333', marginBottom: 8,
  },
  modalAvatar: { width: 72, height: 72, borderRadius: 12, marginBottom: 4 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: 'SpaceMono' },
  modalSteam: { fontSize: 11, color: '#444', fontFamily: 'SpaceMono', textAlign: 'center' },
  modalStatus: { width: '100%', marginTop: 4, gap: 8 },
  cleanBadge: {
    backgroundColor: '#00FF8715', borderWidth: 1, borderColor: '#00FF8730',
    borderRadius: 8, padding: 12, alignItems: 'center',
  },
  cleanBadgeText: { color: '#00FF87', fontSize: 13, fontFamily: 'SpaceMono' },
  modalBanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF3D5710', borderWidth: 1,
    borderRadius: 8, padding: 12,
  },
  modalBanPlatform: { fontSize: 12, fontWeight: '700', color: '#ddd', fontFamily: 'SpaceMono' },
  modalBanType: { fontSize: 11, color: '#FF3D57', fontFamily: 'SpaceMono' },
  modalBanDate: { fontSize: 10, color: '#555', fontFamily: 'SpaceMono' },

  removeBtn: {
    width: '100%', backgroundColor: '#FF3D5715',
    borderWidth: 1, borderColor: '#FF3D5740',
    borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8,
  },
  removeBtnText: { color: '#FF3D57', fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono' },
  closeBtn: {
    width: '100%', backgroundColor: '#161616',
    borderWidth: 1, borderColor: '#222',
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  closeBtnText: { color: '#555', fontSize: 13, fontFamily: 'SpaceMono' },

  addInput: {
    width: '100%',
    backgroundColor: '#0D0D0D',
    borderWidth: 1, borderColor: '#222',
    borderRadius: 10, padding: 12,
    color: '#ddd', fontSize: 12,
    fontFamily: 'SpaceMono',
    minHeight: 80, textAlignVertical: 'top',
    lineHeight: 20,
  },
  addError: { color: '#FF3D57', fontSize: 12, fontFamily: 'SpaceMono', alignSelf: 'flex-start' },
  addConfirmBtn: {
    width: '100%', backgroundColor: '#00FF87',
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  addConfirmText: { color: '#000', fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono' },
});
