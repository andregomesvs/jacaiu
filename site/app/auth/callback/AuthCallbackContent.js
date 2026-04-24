'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Autenticando...');

  useEffect(() => {
    async function handleCallback() {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const next = searchParams.get('next') || '/dashboard';
      const error = searchParams.get('error');

      if (error) {
        setStatus('Erro na autenticação. Redirecionando...');
        setTimeout(() => router.push('/login?error=' + error), 2000);
        return;
      }

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (verifyError) {
          console.error('Erro ao verificar token:', verifyError);
          setStatus('Falha na autenticação. Redirecionando...');
          setTimeout(() => router.push('/login?error=token_invalid'), 2000);
          return;
        }
      }

      setStatus('Login realizado! Redirecionando...');
      router.push(next);
    }

    handleCallback();
  }, [router, searchParams]);

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
