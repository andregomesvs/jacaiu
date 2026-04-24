// app/app/(tabs)/perfil.js
// Tela de perfil do usuário

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, Alert, StatusBar, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase, getProfile, updateProfile, uploadAvatar } from '../../../backend/supabaseClient';
import { useRouter } from 'expo-router';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ total: 0, banned: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      const { data } = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setUsername(data.username || '');
      }
      // Carregar stats
      const { data: players } = await supabase
        .from('players')
        .select('id, is_banned')
        .eq('user_id', user.id);
      if (players) {
        setStats({
          total: players.length,
          banned: players.filter(p => p.is_banned).length,
        });
      }
    });
  }, []);

  async function handleSave() {
    if (!username.trim()) { Alert.alert('Erro', 'Nome de usuário não pode ser vazio'); return; }
    setSaving(true);
    const { error } = await updateProfile(user.id, { username: username.trim() });
    setSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permite acesso à galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: `avatar_${user.id}.jpg`,
        type: 'image/jpeg',
      };
      const { url, error } = await uploadAvatar(user.id, file);
      if (url) {
        await updateProfile(user.id, { avatar_url: url });
        setProfile(prev => ({ ...prev, avatar_url: url }));
      } else {
        Alert.alert('Erro', 'Não foi possível fazer upload da foto.');
      }
      setUploadingAvatar(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }
      }
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          {saved && <Text style={styles.savedBadge}>✓ Salvo</Text>}
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator color="#00FF87" />
              </View>
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{user?.email?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={{ fontSize: 12 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00FF87' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Monitorados</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF3D57' }]}>{stats.banned}</Text>
            <Text style={styles.statLabel}>Banidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FFD93D' }]}>3</Text>
            <Text style={styles.statLabel}>Plataformas</Text>
          </View>
        </View>

        {/* Form */}
        <Text style={styles.sectionTitle}>DADOS DA CONTA</Text>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>NOME DE USUÁRIO</Text>
            <TextInput
              style={styles.formInput}
              value={username}
              onChangeText={setUsername}
              placeholder="seu_usuario"
              placeholderTextColor="#333"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>E-MAIL</Text>
            <View style={styles.formInputDisabled}>
              <Text style={styles.formInputDisabledText}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </TouchableOpacity>

        {/* Login methods */}
        <Text style={styles.sectionTitle}>MÉTODOS DE LOGIN</Text>
        <View style={styles.card}>
          <View style={styles.loginMethodRow}>
            <Text style={styles.loginMethodIcon}>📧</Text>
            <Text style={styles.loginMethodLabel}>E-mail e senha</Text>
            <Text style={styles.loginMethodStatus}>✓ Ativo</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.version}>Já Caiu? v1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'SpaceMono' },
  savedBadge: {
    fontSize: 11, color: '#00FF87',
    backgroundColor: '#00FF8720', borderWidth: 1, borderColor: '#00FF8740',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontFamily: 'SpaceMono',
  },

  avatarSection: { alignItems: 'center', marginBottom: 24, gap: 8 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    backgroundColor: '#00FF8720', borderWidth: 2, borderColor: '#00FF87',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#00FF87', fontSize: 28, fontWeight: '700' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#111', borderWidth: 2, borderColor: '#1E1E1E',
    borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: 11, color: '#444', fontFamily: 'SpaceMono' },

  statsRow: {
    backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1E1E1E',
    flexDirection: 'row', alignItems: 'center', marginBottom: 28, overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', padding: 16 },
  statDivider: { width: 1, height: 40, backgroundColor: '#1E1E1E' },
  statValue: { fontSize: 26, fontWeight: '700', fontFamily: 'SpaceMono' },
  statLabel: { fontSize: 10, color: '#555', marginTop: 2, fontFamily: 'SpaceMono' },

  sectionTitle: {
    fontSize: 10, color: '#555', letterSpacing: 1.5,
    fontFamily: 'SpaceMono', marginBottom: 10, marginTop: 4,
  },

  card: {
    backgroundColor: '#111', borderRadius: 12,
    borderWidth: 1, borderColor: '#1E1E1E', marginBottom: 16, overflow: 'hidden',
  },
  formGroup: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#161616',
  },
  formLabel: { fontSize: 10, color: '#555', letterSpacing: 1, fontFamily: 'SpaceMono', marginBottom: 8 },
  formInput: {
    backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#222',
    borderRadius: 8, padding: 10, color: '#ddd', fontSize: 13, fontFamily: 'SpaceMono',
  },
  formInputDisabled: {
    backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1A1A1A',
    borderRadius: 8, padding: 10,
  },
  formInputDisabledText: { color: '#444', fontSize: 13, fontFamily: 'SpaceMono' },

  saveBtn: {
    backgroundColor: '#00FF87', borderRadius: 10,
    padding: 14, alignItems: 'center', marginBottom: 24,
  },
  saveBtnText: { color: '#000', fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono' },

  loginMethodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  loginMethodIcon: { fontSize: 18 },
  loginMethodLabel: { flex: 1, fontSize: 13, color: '#ccc', fontFamily: 'SpaceMono' },
  loginMethodStatus: { fontSize: 12, color: '#00FF87', fontFamily: 'SpaceMono' },

  signOutBtn: {
    backgroundColor: '#FF3D5715', borderWidth: 1, borderColor: '#FF3D5740',
    borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8,
  },
  signOutText: { color: '#FF3D57', fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono' },

  version: { textAlign: 'center', fontSize: 10, color: '#2A2A2A', fontFamily: 'SpaceMono', marginTop: 24 },
});
