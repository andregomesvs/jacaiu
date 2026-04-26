'use client';
// Fundo gaming estilizado com SVG — substitui imagem CS2

export default function GamingBackground() {
  return (
    <>
      {/* Fundo escuro com gradientes sutis */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(135deg, #0A0E14 0%, #0D1420 30%, #111820 60%, #0A0E14 100%)',
      }} />

      {/* Radiais de cor */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 15% 80%, rgba(255,70,85,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(255,70,85,0.03) 0%, transparent 70%)
        `,
      }} />

      {/* Grid sutil */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4,
        backgroundImage: `
          linear-gradient(rgba(255,70,85,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,70,85,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Crosshair decorativo central (sutil) */}
      <svg style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 200, height: 200, opacity: 0.03, zIndex: 0, pointerEvents: 'none',
      }} viewBox="0 0 200 200">
        <line x1="100" y1="30" x2="100" y2="85" stroke="#FF4655" strokeWidth="2" />
        <line x1="100" y1="115" x2="100" y2="170" stroke="#FF4655" strokeWidth="2" />
        <line x1="30" y1="100" x2="85" y2="100" stroke="#FF4655" strokeWidth="2" />
        <line x1="115" y1="100" x2="170" y2="100" stroke="#FF4655" strokeWidth="2" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#FF4655" strokeWidth="1" />
        <circle cx="100" cy="100" r="3" fill="#FF4655" />
      </svg>

      {/* Partículas decorativas */}
      <svg style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', opacity: 0.5,
      }} viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <circle cx="150" cy="200" r="1" fill="#FF4655" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="150" r="1.5" fill="#3B82F6" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="700" r="1" fill="#FF4655" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="650" cy="500" r="1" fill="#4ADE80" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="900" cy="800" r="1.5" fill="#FF4655" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="900" r="1" fill="#3B82F6" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="500" cy="100" r="1" fill="#FBBF24" opacity="0.2">
          <animate attributeName="opacity" values="0.2;0.05;0.2" dur="7s" repeatCount="indefinite" />
        </circle>
      </svg>
    </>
  );
}
