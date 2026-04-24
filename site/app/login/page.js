'use client';
// site/app/login/page.js

import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  async function handleGoogle() {
    await signInWithGoogle();
  }

  return (
    <div style={s.root}>
      <div style={s.bgDecor} />
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoIcon}>⬇</span>
          <span style={s.logoText}>Já Caiu?</span>
        </div>
        <p style={s.tagline}>Monitor de bans para jogadores de CS2</p>

        <button style={s.btnGoogle} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Entrar com Google
        </button>

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
    alignItems: 'center',
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
  btnGoogle: {
    background: '#161616',
    border: '1px solid #2A2A2A',
    borderRadius: 8,
    padding: '14px 28px',
    fontSize: 14,
    color: '#ccc',
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    letterSpacing: 0.5,
    width: '100%',
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
