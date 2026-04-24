'use client';
// site/app/login/page.js

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../../lib/supabaseClient';

const STEAM_ERRORS = {
  steam_verification_failed: 'Falha na verificação do login Steam. Tente novamente.',
  invalid_steam_id: 'Steam ID inválido retornado.',
  user_creation_failed: 'Erro ao criar conta via Steam.',
  session_failed: 'Erro ao criar sessão. Tente novamente.',
  steam_callback_error: 'Erro inesperado no login Steam.',
  token_invalid: 'Token de autenticação inválido.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00FF87', fontSize: 14, fontFamily: "'Space Mono', monospace" }}>Carregando...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mostra erros vindos do callback Steam
  useEffect(() => {
    const steamError = searchParams.get('error');
    if (steamError && STEAM_ERRORS[steamError]) {
      setError(STEAM_ERRORS[steamError]);
    }
  }, [searchParams]);

  async function handleSubmit() {
    if (!email || !password) { setError('Preencha e-mail e senha'); return; }
    setLoading(true);
    setError('');

    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos'
          : error.message
      );
    } else if (mode === 'signup') {
      setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await signInWithGoogle();
  }

  return (
    <div style={s.root}>
      {/* Background decorativo */}
      <div style={s.bgDecor} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoIcon}>⬇</span>
          <span style={s.logoText}>Já Caiu?</span>
        </div>
        <p style={s.tagline}>Monitor de bans para jogadores de CS2</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(mode === 'login' ? s.tabActive : {}) }}
            onClick={() => setMode('login')}
          >Entrar</button>
          <button
            style={{ ...s.tab, ...(mode === 'signup' ? s.tabActive : {}) }}
            onClick={() => setMode('signup')}
          >Cadastrar</button>
        </div>

        {/* Form */}
        <div style={s.form}>
          <div style={s.field}>
            <label style={s.label}>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={s.input}
            />
          </div>

          {error && <div style={s.error}>{error}</div>}
          {success && <div style={s.success}>{success}</div>}

          <button style={s.btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <div style={s.divider}><span>ou</span></div>

          <button style={s.btnGoogle} onClick={handleGoogle}>
            <span style={{ fontSize: 16 }}>G</span>
            Continuar com Google
          </button>

          <button style={s.btnSteam} onClick={() => window.location.href = '/api/auth/steam'}>
            <svg width="18" height="18" viewBox="0 0 256 259" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M127.779 0C60.224 0 5.133 52.266 0 118.658l68.905 28.477c5.852-3.999 12.909-6.342 20.52-6.342.682 0 1.357.022 2.027.06l30.704-44.476v-.624c0-27.514 22.394-49.908 49.912-49.908 27.512 0 49.912 22.406 49.912 49.932 0 27.526-22.412 49.932-49.93 49.932h-1.16l-43.76 31.24c0 .532.024 1.064.024 1.584 0 20.644-16.784 37.428-37.44 37.428-18.18 0-33.36-13.024-36.77-30.252L3.388 161.044C21.87 216.754 73.834 258.746 127.779 258.746c70.588 0 127.78-57.186 127.78-127.373C255.559 57.186 198.367 0 127.779 0" />
            </svg>
            Entrar com Steam
          </button>
        </div>

        {/* Platforms preview */}
        <div style={s.platforms}>
          {['🛡️ Steam', '⚡ FACEIT', '🎮 Gamer Club'].map(p => (
            <span key={p} style={s.platformPill}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor: {
    position: 'fixed',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #00FF8708 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: '#111',
    border: '1px solid #1E1E1E',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: { fontSize: 24, color: '#00FF87' },
  logoText: { fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 12, color: '#444', textAlign: 'center', marginBottom: 28, letterSpacing: 0.5 },
  tabs: {
    display: 'flex',
    background: '#0D0D0D',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: '9px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#555',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    transition: 'all 0.15s',
    letterSpacing: 0.5,
  },
  tabActive: { background: '#1E1E1E', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    background: '#0D0D0D',
    border: '1px solid #1E1E1E',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#ddd',
    fontSize: 13,
    fontFamily: "'Space Mono', monospace",
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  error: {
    fontSize: 12,
    color: '#FF3D57',
    background: '#FF3D5715',
    border: '1px solid #FF3D5730',
    padding: '8px 12px',
    borderRadius: 6,
  },
  success: {
    fontSize: 12,
    color: '#00FF87',
    background: '#00FF8715',
    border: '1px solid #00FF8730',
    padding: '8px 12px',
    borderRadius: 6,
  },
  btnPrimary: {
    background: '#00FF87',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#333',
    fontSize: 11,
    letterSpacing: 1,
  },
  btnGoogle: {
    background: '#161616',
    border: '1px solid #2A2A2A',
    borderRadius: 8,
    padding: '11px',
    fontSize: 13,
    color: '#ccc',
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    letterSpacing: 0.5,
  },
  btnSteam: {
    background: '#171A21',
    border: '1px solid #2A2A2A',
    borderRadius: 8,
    padding: '11px',
    fontSize: 13,
    color: '#c7d5e0',
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    letterSpacing: 0.5,
    transition: 'all 0.15s',
  },
  platforms: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  platformPill: {
    fontSize: 11,
    color: '#444',
    background: '#161616',
    border: '1px solid #222',
    padding: '4px 10px',
    borderRadius: 20,
    letterSpacing: 0.3,
  },
};
