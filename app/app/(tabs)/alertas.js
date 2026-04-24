// app/app/(tabs)/alertas.js
// Tela de configuração de alertas

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, StatusBar, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { supabase, getProfile, updateProfile } from '../../../backend/supabaseClient';
import Constants from 'expo-constants';

// Configurar como as notificações aparecem quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PLATFORMS = [
  { key: 'steam',     label: 'Steam (CS2)',       icon: '🛡️', color: '#66C0F4' },
  { key: 'faceit',    label: 'FACEIT',             icon: '⚡',  color: '#FF5500' },
  { key: 'gamerclub', label: 'Gamer Club Brasil',  icon: '🎮',  color: '#00C9A7' },
];

export default function AlertasScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [platforms, setPlatforms] = useState({ steam: true, faceit: true, gamerclub: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      const { data } = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setPushEnabled(data.push_alerts ?? true);
        setEmailEnabled(data.email_alerts ?? true);
      }
    });
  }, []);

  // Solicitar permissão de notificações quando ativar push
  async function handlePushToggle(value) {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão de notificação negada. Ative nas configurações do celular.');
        return;
      }
      // Registra token do dispositivo no Supabase
      const token = await registerPushToken(user.id);
      console.log('Push token:', token);
    }
    setPushEnabled(value);
    await saveAlertSettings({ push_alerts: value });
  }

  async function handleEmailToggle(value) {
    setEmailEnabled(value);
    await saveAlertSettings({ email_alerts: value });
  }

  async function saveAlertSettings(updates) {
    if (!user) return;
    setSaving(true);
    await updateProfile(user.id, updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function registerPushToken(userId) {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await updateProfile(userId, { onesignal_player_id: token.data });
      return token.data;
    } catch (e) {
      console.error('Erro ao registrar push token:', e);
      return null;
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alertas</Text>
          {saved && <Text style={styles.savedBadge}>✓ Salvo</Text>}
        </View>

        {/* Push Notifications */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Notificações Push</Text>
              <Text style={styles.cardDesc}>Alerta direto no celular quando alguém cair</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#2A2A2A', true: '#00FF8780' }}
              thumbColor={pushEnabled ? '#00FF87' : '#555'}
            />
          </View>
          {pushEnabled && (
            <View style={styles.cardNote}>
              <Text style={styles.cardNoteText}>
                ✓ Notificações ativas. Você será avisado em tempo real.
              </Text>
            </View>
          )}
        </View>

        {/* Email */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 20 }}>📧</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Alertas por E-mail</Text>
              <Text style={styles.cardDesc}>Receba um e-mail detalhado com o ban</Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={handleEmailToggle}
              trackColor={{ false: '#2A2A2A', true: '#00FF8780' }}
              thumbColor={emailEnabled ? '#00FF87' : '#555'}
            />
          </View>
          {emailEnabled && profile && (
            <View style={styles.cardNote}>
              <Text style={styles.cardNoteText}>
                Enviando para: {user?.email}
              </Text>
            </View>
          )}
        </View>

        {/* Plataformas */}
        <Text style={styles.sectionTitle}>PLATAFORMAS QUE GERAM ALERTA</Text>
        <View style={styles.card}>
          {PLATFORMS.map((p, i) => (
            <View
              key={p.key}
              style={[styles.platformRow, i < PLATFORMS.length - 1 && styles.platformRowBorder]}
            >
              <Text style={{ fontSize: 20 }}>{p.icon}</Text>
              <Text style={[styles.platformLabel, { color: p.color }]}>{p.label}</Text>
              <Switch
                value={platforms[p.key]}
                onValueChange={val => {
                  setPlatforms(prev => ({ ...prev, [p.key]: val }));
                }}
                trackColor={{ false: '#2A2A2A', true: p.color + '80' }}
                thumbColor={platforms[p.key] ? p.color : '#555'}
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <Text style={styles.sectionTitle}>FREQUÊNCIA DE VERIFICAÇÃO</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>A cada 1 hora</Text>
              <Text style={styles.infoDesc}>
                Todos os jogadores da sua lista são verificados automaticamente a cada hora. Quando um ban for detectado, você é notificado imediatamente.
              </Text>
            </View>
          </View>
        </View>

        {/* Histórico rápido */}
        <Text style={styles.sectionTitle}>SOBRE OS ALERTAS</Text>
        <View style={styles.card}>
          {[
            { icon: '🚨', text: 'Você só recebe alerta quando um novo ban é detectado' },
            { icon: '📋', text: 'O e-mail inclui nome do jogador, plataforma e tipo de ban' },
            { icon: '🔕', text: 'Você pode desativar alertas por plataforma ou no total' },
          ].map((item, i) => (
            <View
              key={i}
              style={[styles.tipRow, i < 2 && styles.tipRowBorder]}
            >
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text style={styles.tipText}>{item.text}</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'SpaceMono' },
  savedBadge: {
    fontSize: 11, color: '#00FF87',
    backgroundColor: '#00FF8720', borderWidth: 1, borderColor: '#00FF8740',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    fontFamily: 'SpaceMono',
  },

  sectionTitle: {
    fontSize: 10, color: '#555',
    letterSpacing: 1.5, fontFamily: 'SpaceMono',
    marginBottom: 10, marginTop: 8,
  },

  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  cardIcon: {
    width: 40, height: 40,
    backgroundColor: '#1A1A1A', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#ddd', fontFamily: 'SpaceMono' },
  cardDesc: { fontSize: 11, color: '#555', marginTop: 2, fontFamily: 'SpaceMono' },
  cardNote: {
    backgroundColor: '#00FF8708',
    borderTopWidth: 1, borderTopColor: '#00FF8720',
    padding: 10, paddingHorizontal: 16,
  },
  cardNoteText: { fontSize: 11, color: '#00FF87', fontFamily: 'SpaceMono' },

  platformRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  platformRowBorder: { borderBottomWidth: 1, borderBottomColor: '#161616' },
  platformLabel: { flex: 1, fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono' },

  infoRow: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' },
  infoIcon: { fontSize: 18, marginTop: 2 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#ddd', fontFamily: 'SpaceMono', marginBottom: 4 },
  infoDesc: { fontSize: 11, color: '#555', fontFamily: 'SpaceMono', lineHeight: 18 },

  tipRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: '#161616' },
  tipText: { flex: 1, fontSize: 12, color: '#666', fontFamily: 'SpaceMono', lineHeight: 18 },
});
