'use client';
// site/app/alertas/page.js

import { useState, useEffect } from 'react';
import { supabase, getProfile, updateProfile } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styles from './alertas.module.css';

const PLATFORMS = [
  { key: 'steam',     label: 'Steam (CS2)',       icon: '🛡️', color: '#66C0F4' },
  { key: 'faceit',    label: 'FACEIT',             icon: '⚡',  color: '#FF5500' },
  { key: 'gamerclub', label: 'Gamer Club Brasil',  icon: '🎮',  color: '#00C9A7' },
];

export default function AlertasPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      const { data } = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setEmailEnabled(data.email_alerts ?? true);
        setPushEnabled(data.push_alerts ?? true);
      }
    });
  }, []);

  async function save(updates) {
    if (!user) return;
    setSaving(true);
    await updateProfile(user.id, updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function Toggle({ value, onChange }) {
    return (
      <div
        className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
        onClick={() => onChange(!value)}
      >
        <div className={styles.toggleThumb} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurar Alertas</h1>
          <p className={styles.subtitle}>Escolha como deseja ser notificado</p>
        </div>
        {saved && <span className={styles.savedTag}>✓ Salvo</span>}
      </div>

      {/* E-mail */}
      <div className={styles.card}>
        <div className={styles.cardRow}>
          <div className={styles.cardIconWrap}>📧</div>
          <div className={styles.cardText}>
            <div className={styles.cardTitle}>Alertas por E-mail</div>
            <div className={styles.cardDesc}>Receba e-mail quando alguém for banido</div>
          </div>
          <Toggle value={emailEnabled} onChange={v => { setEmailEnabled(v); save({ email_alerts: v }); }} />
        </div>
        {emailEnabled && (
          <div className={styles.cardDetail}>
            <span className={styles.cardDetailLabel}>E-mail de destino:</span>
            <span className={styles.cardDetailValue}>{user?.email}</span>
          </div>
        )}
      </div>

      {/* Push */}
      <div className={styles.card}>
        <div className={styles.cardRow}>
          <div className={styles.cardIconWrap}>🔔</div>
          <div className={styles.cardText}>
            <div className={styles.cardTitle}>Notificações Push</div>
            <div className={styles.cardDesc}>Alertas no app iOS e Android</div>
          </div>
          <Toggle value={pushEnabled} onChange={v => { setPushEnabled(v); save({ push_alerts: v }); }} />
        </div>
      </div>

      {/* Plataformas */}
      <h2 className={styles.sectionTitle}>PLATAFORMAS QUE GERAM ALERTA</h2>
      <div className={styles.card}>
        {PLATFORMS.map((p, i) => (
          <div key={p.key} className={`${styles.platformRow} ${i < PLATFORMS.length - 1 ? styles.platformRowBorder : ''}`}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <span className={styles.platformLabel} style={{ color: p.color }}>{p.label}</span>
            <Toggle value={true} onChange={() => {}} />
          </div>
        ))}
      </div>

      {/* Info */}
      <h2 className={styles.sectionTitle}>SOBRE OS ALERTAS</h2>
      <div className={styles.card}>
        {[
          { icon: '⏱', title: 'Verificação a cada 1 hora', desc: 'Todos os jogadores são verificados automaticamente.' },
          { icon: '🚨', title: 'Alerta imediato', desc: 'Assim que um ban é detectado, a notificação é enviada.' },
          { icon: '📋', title: 'E-mail detalhado', desc: 'Inclui nome do jogador, plataforma e tipo de ban.' },
        ].map((item, i) => (
          <div key={i} className={`${styles.infoRow} ${i < 2 ? styles.infoRowBorder : ''}`}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div>
              <div className={styles.infoTitle}>{item.title}</div>
              <div className={styles.infoDesc}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
