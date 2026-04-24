// site/app/auth/callback/page.js
export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

const AuthCallbackContent = nextDynamic(() => import('./AuthCallbackContent'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#00FF87', fontSize: 14, fontFamily: "'Space Mono', monospace" }}>Carregando...</p>
    </div>
  ),
});

export default function AuthCallbackPage() {
  return <AuthCallbackContent />;
}
