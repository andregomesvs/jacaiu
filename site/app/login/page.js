'use client';

import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '../../lib/supabaseClient';
import GamingBackground from '../components/GamingBackground';
import { Shield } from '../components/Icons';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div style={s.root}>
      <GamingBackground />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoBox}>
            <span style={s.logoLetters}>JC</span>
          </div>
        </div>

        <h1 style={s.title}>
          JA CAIU<span style={s.titleAccent}>?</span>
        </h1>
        <p style={s.subtitle}>
          Monitor de bans para CS2.
          <br />Saiba quem ja tomou ban.
        </p>

        {/* Google Button */}
        <button style={s.googleBtn} onClick={() => signInWithGoogle()}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Entrar com Google
        </button>

        {/* Plataformas */}
        <div style={s.platforms}>
          <div style={s.pill}>
            <Shield size={14} color="#66C0F4" />
            <span style={{ color: '#66C0F4' }}>Steam</span>
          </div>
          <div style={s.pill}>
            <Shield size={14} color="#FF5500" />
            <span style={{ color: '#FF5500' }}>FACEIT</span>
          </div>
          <div style={s.pill}>
            <Shield size={14} color="#4ADE80" />
            <span style={{ color: '#4ADE80' }}>GC</span>
          </div>
        </div>
      </div>

      <p style={s.footer}>
        JA CAIU? &copy; {new Date().getFullYear()} &middot; CS2 Community
      </p>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'rgba(21,28,40,0.85)',
    backdropFilter: 'blur(16px)',
    borderRadius: 16,
    border: '1px solid #1E2A3A',
    padding: '48px 36px 36px',
    width: '100%',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: { marginBottom: 16 },
  logoBox: {
    width: 72, height: 72, borderRadius: 14,
    background: '#FF4655',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: 'rotate(-8deg)',
    boxShadow: '0 6px 24px rgba(255,70,85,0.4)',
  },
  logoLetters: {
    fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: 2,
  },
  title: {
    fontSize: 32, fontWeight: 800, color: '#fff',
    letterSpacing: 3, textTransform: 'uppercase',
    marginBottom: 8,
  },
  titleAccent: { color: '#FF4655' },
  subtitle: {
    fontSize: 14, color: '#7A8599', textAlign: 'center',
    lineHeight: 1.5, marginBottom: 32,
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, width: '100%', padding: '14px 24px',
    borderRadius: 10, border: '1px solid #1E2A3A',
    background: '#111820', fontSize: 15, fontWeight: 600,
    color: '#E8EAED', cursor: 'pointer',
    fontFamily: "var(--font-sans), sans-serif",
    transition: 'all 0.2s',
  },
  platforms: {
    display: 'flex', gap: 8, marginTop: 24,
  },
  pill: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, padding: '5px 12px',
    borderRadius: 6, background: 'rgba(30,42,58,0.6)',
    border: '1px solid #253345',
  },
  footer: {
    fontSize: 11, color: '#334455', marginTop: 24,
    textAlign: 'center', position: 'relative', zIndex: 1,
    textTransform: 'uppercase', letterSpacing: 1,
  },
};
