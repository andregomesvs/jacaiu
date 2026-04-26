// site/app/page.js — Página inicial (landing page)

import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <main className={styles.root}>
      {/* Background grid */}
      <div className={styles.grid} />

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoIcon}>⬇</span>
          Já Caiu?
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navBtn}>Entrar</Link>
          <Link href="/login" className={styles.navBtnPrimary}>Criar conta grátis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Monitoramento em tempo real
        </div>
        <h1 className={styles.heroTitle}>
          Já Caiu?
        </h1>
        <p className={styles.heroSub}>
          Adicione jogadores da Steam à sua lista e receba alertas automáticos
          quando alguém for banido no CS2, FACEIT ou Gamer Club Brasil.
        </p>
        <div className={styles.heroCta}>
          <Link href="/login" className={styles.ctaPrimary}>
            Começar grátis →
          </Link>
          <span className={styles.ctaNote}>Sem cartão. Sem pegadinha.</span>
        </div>

        {/* Plataformas */}
        <div className={styles.platforms}>
          {[
            { icon: '🛡️', name: 'Steam (CS2)', color: '#66C0F4' },
            { icon: '⚡', name: 'FACEIT', color: '#FF5500' },
            { icon: '🎮', name: 'Gamer Club Brasil', color: '#00C9A7' },
          ].map(p => (
            <div key={p.name} className={styles.platformChip} style={{ borderColor: p.color + '44' }}>
              <span>{p.icon}</span>
              <span style={{ color: p.color }}>{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        {[
          {
            icon: '⚡',
            title: 'Alertas instantâneos',
            desc: 'Receba e-mail e notificação push assim que um ban for detectado.',
            color: '#FFD93D',
          },
          {
            icon: '◈',
            title: 'Lista ilimitada',
            desc: 'Adicione quantos jogadores quiser. Cole o link do perfil Steam.',
            color: '#00FF87',
          },
          {
            icon: '◉',
            title: '3 plataformas',
            desc: 'Monitora Steam VAC, FACEIT e Gamer Club simultaneamente.',
            color: '#FF5500',
          },
          {
            icon: '📱',
            title: 'App iOS e Android',
            desc: 'Leve o monitor no bolso. Notificações push mesmo com app fechado.',
            color: '#66C0F4',
          },
        ].map(f => (
          <div key={f.title} className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ color: f.color }}>{f.icon}</div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.howTitle}>Como funciona</h2>
        <div className={styles.steps}>
          {[
            { num: '01', title: 'Crie sua conta', desc: 'Login rápido com Google em segundos.' },
            { num: '02', title: 'Adicione jogadores', desc: 'Cole o link do perfil Steam de quem quiser monitorar.' },
            { num: '03', title: 'Receba alertas', desc: 'Quando alguém cair, você é notificado na hora.' },
          ].map(step => (
            <div key={step.num} className={styles.step}>
              <div className={styles.stepNum}>{step.num}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Pronto pra saber quem já caiu?</h2>
        <Link href="/login" className={styles.ctaPrimary}>
          Criar conta grátis →
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>⬇ Já Caiu? © {new Date().getFullYear()}</span>
        <span>Feito para a comunidade CS2 brasileira</span>
      </footer>
    </main>
  );
}
