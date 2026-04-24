'use client';
// site/app/auth/callback/page.js
// Processa callback do Google OAuth via Supabase

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Autenticando...');

  useEffect(() => {
    // O Supabase processa o hash automaticamente.
    // Aguarda um momento e redireciona para o dashboard.
    const timer = setTimeout(() => {
      setStatus('Login realizado! Redirecionando...');
      router.push('/dashboard');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Mono', monospace",
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>⬇</div>
        <p style={{ color: '#00FF87', fontSize: 14 }}>{status}</p>
      </div>
    </div>
  );
}
