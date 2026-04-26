'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Autenticando...');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('Login realizado! Redirecionando...');
      router.push('/dashboard');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0E14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "var(--font-sans), sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: '50%',
          border: '3px solid #1E2A3A',
          borderTopColor: '#FF4655',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#7A8599', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{status}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
