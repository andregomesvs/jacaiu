// app/app/login.js
// Tela de login do app

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, ActivityIndicator, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmail, signUpWithEmail, supabase } from '../../backend/supabaseClient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// URL do seu site na Vercel (ajuste para produção)
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://jacaiu.vercel.app';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [steamLoading, setSteamLoading] = useState(false);

  async function handleSteamLogin() {
    setSteamLoading(true);
    setError('');
    try {
      // Abre o navegador para login via Steam no site
      // O callback do server redireciona para jacaiu://auth/callback?token_hash=...
      const result = await WebBrowser.openAuthSessionAsync(
        `${SITE_URL}/api/auth/steam?returnTo=/auth/callback-mobile`,
        'jacaiu://auth/callback'
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const tokenHash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        const errorParam = url.searchParams.get('error');

        if (errorParam) {
          setError('Falha no login Steam. Tente novamente.');
          setSteamLoading(false);
          return;
        }

        if (tokenHash && type) {
          // Verifica o token magic link para criar a sessão
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (!verifyError) {
            router.replace('/(tabs)');
            return;
          }
          console.error('Erro ao verificar token Steam:', verifyError);
        }
        setError('Falha ao processar login Steam.');
      }
    } catch (err) {
      setError('Erro ao abrir login Steam.');
    }
    setSteamLoading(false);
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email.trim().toLowerCase(), password);

    setLoading(false);

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos'
          : error.message === 'User already registered'
          ? 'Este e-mail já está cadastrado. Faça login.'
          : error.message
      );
    } else if (mode === 'signup') {
      setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.root, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>⬇</Text>
          <Text style={styles.logoText}>Já Caiu?</Text>
          <Text style={styles.tagline}>Monitor de bans para CS2</Text>
        </View>

        {/* Plataformas */}
        <View style={styles.platforms}>
          {['🛡️ Steam', '⚡ FACEIT', '🎮 Gamer Club'].map(p => (
            <View key={p} style={styles.platformPill}>
              <Text style={styles.platformPillText}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {['login', 'signup'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => { setMode(m); setError(''); setSuccess(''); }}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>E-MAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#333"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>SENHA</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#333"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* Feedback */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Botão */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botão Steam */}
          <TouchableOpacity
            style={[styles.steamBtn, steamLoading && { opacity: 0.6 }]}
            onPress={handleSteamLogin}
            disabled={steamLoading}
          >
            {steamLoading
              ? <ActivityIndicator color="#c7d5e0" />
              : <>
                  <Text style={styles.steamIcon}>🎮</Text>
                  <Text style={styles.steamBtnText}>Entrar com Steam</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Monitoramento automático a cada hora.{'\n'}Notificações em tempo real.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  content: {
    flexGrow: 1, justifyContent: 'center',
    padding: 24, paddingBottom: 40,
  },

  logoSection: { alignItems: 'center', marginBottom: 20 },
  logoIcon: { fontSize: 40, marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'SpaceMono' },
  tagline: { fontSize: 12, color: '#444', marginTop: 4, fontFamily: 'SpaceMono', letterSpacing: 0.5 },

  platforms: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, marginBottom: 28, flexWrap: 'wrap',
  },
  platformPill: {
    backgroundColor: '#161616', borderWidth: 1, borderColor: '#222',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  platformPillText: { fontSize: 11, color: '#555', fontFamily: 'SpaceMono' },

  card: {
    backgroundColor: '#111', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E1E1E', padding: 24, gap: 16,
  },

  tabs: {
    flexDirection: 'row', backgroundColor: '#0D0D0D',
    borderRadius: 10, padding: 4, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1E1E1E' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '700', fontFamily: 'SpaceMono' },
  tabTextActive: { color: '#fff' },

  formGroup: { gap: 6 },
  label: { fontSize: 10, color: '#555', letterSpacing: 1, fontFamily: 'SpaceMono' },
  input: {
    backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#222',
    borderRadius: 8, padding: 12, color: '#ddd', fontSize: 13, fontFamily: 'SpaceMono',
  },

  errorBox: {
    backgroundColor: '#FF3D5715', borderWidth: 1, borderColor: '#FF3D5730',
    borderRadius: 8, padding: 10,
  },
  errorText: { color: '#FF3D57', fontSize: 12, fontFamily: 'SpaceMono' },
  successBox: {
    backgroundColor: '#00FF8715', borderWidth: 1, borderColor: '#00FF8730',
    borderRadius: 8, padding: 10,
  },
  successText: { color: '#00FF87', fontSize: 12, fontFamily: 'SpaceMono' },

  submitBtn: {
    backgroundColor: '#00FF87', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  submitBtnText: { color: '#000', fontSize: 14, fontWeight: '700', fontFamily: 'SpaceMono' },

  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: '#222',
  },
  dividerText: {
    fontSize: 11, color: '#444', fontFamily: 'SpaceMono', letterSpacing: 1,
  },

  steamBtn: {
    backgroundColor: '#171A21', borderWidth: 1, borderColor: '#2A2A2A',
    borderRadius: 10, padding: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  steamIcon: { fontSize: 18 },
  steamBtnText: {
    color: '#c7d5e0', fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono',
  },

  footer: {
    textAlign: 'center', fontSize: 11, color: '#333',
    marginTop: 24, fontFamily: 'SpaceMono', lineHeight: 18,
  },
});
