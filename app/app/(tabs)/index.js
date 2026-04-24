// app/app/(tabs)/index.js
// Tela principal do app (Dashboard)

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Image, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, getPlayers, getProfile } from '../../../backend/supabaseClient';
import { useRouter } from 'expo-router';

const PLATFORM_CONFIG = {
  steam:      { label: 'Steam (CS2)',       icon: '🛡️', color: '#66C0F4' },
  faceit:     { label: 'FACEIT',            icon: '⚡', color: '#FF5500' },
  gamerclub:  { label: 'Gamer Club Brasil', icon: '🎮', color: '#00C9A7' },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      loadData(user.id);
    });

    // Realtime: recebe updates de bans
    const channel = supabase
      .channel('bans-mobile')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bans' }, () => {
        if (user) loadData(user.id);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadData(userId) {
    const [playersRes, profileRes] = await Promise.all([
      getPlayers(userId),
      getProfile(userId),
    ]);
    if (playersRes.data) setPlayers(playersRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    if (user) loadData(user.id);
  };

  const bannedPlayers = players.filter(p => p.is_banned);
  const recentBans = players.flatMap(p =>
    (p.bans || []).map(b => ({ ...b, player: p }))
  ).sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at)).slice(0, 5);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF87" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {profile?.username || 'jogador'} 👋</Text>
            <Text style={styles.headerTitle}>⬇ Já Caiu?</Text>
          </View>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.email?.[0]?.toUpperCase()}</Text>
              </View>
          }
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: '#00FF87' }]}>
            <Text style={[styles.statValue, { color: '#00FF87' }]}>{players.length}</Text>
            <Text style={styles.statLabel}>Monitorados</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#FF3D57' }]}>
            <Text style={[styles.statValue, { color: '#FF3D57' }]}>{bannedPlayers.length}</Text>
            <Text style={styles.statLabel}>Banidos</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#00FF87' }]}>
            <Text style={[styles.statValue, { color: '#00FF87' }]}>{players.length - bannedPlayers.length}</Text>
            <Text style={styles.statLabel}>Limpos</Text>
          </View>
        </View>

        {/* Bans recentes */}
        <Text style={styles.sectionTitle}>BANS RECENTES</Text>
        <View style={styles.card}>
          {recentBans.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum ban detectado 🎉</Text>
          ) : (
            recentBans.map((b, i) => {
              const cfg = PLATFORM_CONFIG[b.platform] || {};
              return (
                <View key={i} style={[styles.banRow, i < recentBans.length - 1 && styles.banRowBorder]}>
                  <Image
                    source={{ uri: b.player.avatar_url || 'https://via.placeholder.com/36' }}
                    style={styles.banAvatar}
                  />
                  <View style={styles.banInfo}>
                    <Text style={styles.banName}>{b.player.display_name}</Text>
                    <Text style={styles.banPlatform}>{cfg.icon} {cfg.label} · {b.ban_type}</Text>
                  </View>
                  <View style={[styles.banBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
                    <Text style={[styles.banBadgeText, { color: cfg.color }]}>
                      {new Date(b.detected_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Plataformas */}
        <Text style={styles.sectionTitle}>PLATAFORMAS</Text>
        <View style={styles.platformsGrid}>
          {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
            <View key={key} style={[styles.platformCard, { borderColor: cfg.color + '44' }]}>
              <Text style={styles.platformIcon}>{cfg.icon}</Text>
              <Text style={styles.platformName}>{cfg.label}</Text>
              <Text style={[styles.platformStatus, { color: cfg.color }]}>● Ativo</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 12, color: '#555', letterSpacing: 0.5, fontFamily: 'SpaceMono' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'SpaceMono', marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#00FF8720',
    borderWidth: 1, borderColor: '#00FF87',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#00FF87', fontSize: 16, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderTopWidth: 2,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', fontFamily: 'SpaceMono' },
  statLabel: { fontSize: 10, color: '#555', marginTop: 2, letterSpacing: 0.5, fontFamily: 'SpaceMono' },

  sectionTitle: {
    fontSize: 10,
    color: '#555',
    letterSpacing: 1.5,
    fontFamily: 'SpaceMono',
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: 24,
    overflow: 'hidden',
  },
  emptyText: { color: '#333', fontSize: 13, padding: 20, textAlign: 'center', fontFamily: 'SpaceMono' },

  banRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  banRowBorder: { borderBottomWidth: 1, borderBottomColor: '#161616' },
  banAvatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#222' },
  banInfo: { flex: 1 },
  banName: { fontSize: 13, fontWeight: '700', color: '#ddd', fontFamily: 'SpaceMono' },
  banPlatform: { fontSize: 10, color: '#555', marginTop: 2, fontFamily: 'SpaceMono' },
  banBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  banBadgeText: { fontSize: 10, fontFamily: 'SpaceMono' },

  platformsGrid: { flexDirection: 'column', gap: 10, marginBottom: 20 },
  platformCard: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIcon: { fontSize: 22 },
  platformName: { fontSize: 13, fontWeight: '700', color: '#ddd', fontFamily: 'SpaceMono', flex: 1 },
  platformStatus: { fontSize: 11, fontFamily: 'SpaceMono' },
});
