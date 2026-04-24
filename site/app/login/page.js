// site/app/login/page.js
import dynamic from 'next/dynamic';

const LoginContent = dynamic(() => import('./LoginContent'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#00FF87', fontSize: 14, fontFamily: "'Space Mono', monospace" }}>Carregando...</p>
    </div>
  ),
});

export default function LoginPage() {
  return <LoginContent />;
}
