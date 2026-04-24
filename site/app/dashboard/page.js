'use client';
// site/app/dashboard/page.js
// Página principal do dashboard após login

import { useState, useEffect } from 'react';
import { supabase, getPlayers, addPlayer, removePlayer, getProfile } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [steamInput, setSteamInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState('');
  const [listCounts, setListCounts] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      loadData(user.id);
    });

    // Realtime: atualiza lista se algum ban for detectado
    const channel = supabase
      .channel('bans-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bans' }, () => {
        if (user) loadData(user.id);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadData(userId) {
    setLoading(true);
    const [playersRes, profileRes] = await Promise.all([
      getPlayers(userId),
      getProfile(userId)
    ]);
    if (playersRes.data) {
      setPlayers(playersRes.data);
      // Busca quantas listas cada jogador está
      loadListCounts(playersRes.data);
    }
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  }

  async function loadListCounts(playersList) {
    const steamIds = playersList.map(p => p.steam_id).filter(Boolean);
    if (steamIds.length === 0) return;

    try {
      const res = await fetch('/api/player-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamIds }),
      });
      const counts = await res.json();
      setListCounts(counts);
    } catch {
      // Silently fail
    }
  }

  async function handleAddPlayer() {
    if (!steamInput.trim()) return;
    setAdding(true);
    setAddError('');

    const { data, error } = await addPlayer(user.id, steamInput);
    if (error) {
      setAddError(error.message === 'duplicate key value violates unique constraint'
        ? 'Esse jogador já está na sua lista!'
        : error.message);
    } else {
      setPlayers(prev => [{ ...data, bans: [] }, ...prev]);
      setSteamInput('');
      setAddOpen(false);
      // Verifica bans imediatamente após adicionar
      checkBans(data.id);
    }
    setAdding(false);
  }

  async function handleRemove(playerId) {
    await removePlayer(playerId);
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setSelectedPlayer(null);
  }

  async function checkBans(playerId = null) {
    setChecking(true);
    setCheckResult('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/check-bans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(playerId ? { playerId } : { checkAll: true }),
      });
      const result = await res.json();

      if (result.bansFound > 0) {
        setCheckResult(`${result.bansFound} ban(s) encontrado(s)!`);
      } else {
        setCheckResult(`${result.checked} jogador(es) verificado(s). Nenhum ban novo.`);
      }

      // Recarrega dados para atualizar status
      await loadData(user.id);
    } catch (err) {
      setCheckResult('Erro ao verificar bans.');
    }
    setChecking(false);
    setTimeout(() => setCheckResult(''), 5000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const filtered = players.filter(p => {
    const matchSearch = p.display_name.toLowerCase().includes(search.toLowerCase())
      || p.steam_id.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'banidos') return matchSearch && p.is_banned;
    if (activeTab === 'limpos') return matchSearch && !p.is_banned;
    return matchSearch;
  });

  const bannedCount = players.filter(p => p.is_banned).length;

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>⬇ Já Caiu?</div>
      <div className={styles.loadingDots}>
        <span /><span /><span />
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬇</span>
          <span className={styles.logoText}>Já Caiu?</span>
        </div>

        <nav className={styles.nav}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
            { id: 'lista', label: 'Minha Lista', icon: '◈' },
            { id: 'alertas', label: 'Alertas', icon: '◉' },
            { id: 'perfil', label: 'Perfil', icon: '○' },
          ].map(item => (
            <a key={item.id} href={`/${item.id === 'dashboard' ? 'dashboard' : item.id}`} className={styles.navItem}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} className={styles.userAvatar} alt="" />
              : <div className={styles.userAvatarInitials}>{user?.email?.[0]?.toUpperCase()}</div>
            }
            <div>
              <div className={styles.userName}>{profile?.username || user?.email?.split('@')[0]}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>Sair</button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={styles.main}>
        <div className={styles.content}>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Dashboard</h1>
              <p className={styles.subtitle}>Monitoramento em tempo real</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={styles.checkBtn}
                onClick={() => checkBans()}
                disabled={checking}
              >
                {checking ? '⏳ Verificando...' : '🔍 Verificar bans'}
              </button>
              <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
                + Adicionar jogador
              </button>
            </div>
          </div>

          {/* Resultado da verificação */}
          {checkResult && (
            <div className={styles.checkResult}>
              {checkResult}
            </div>
          )}

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <div className={styles.statLabel}>Monitorados</div>
              <div className={styles.statValue}>{players.length}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statRed}`}>
              <div className={styles.statLabel}>Banidos</div>
              <div className={styles.statValue}>{bannedCount}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <div className={styles.statLabel}>Limpos</div>
              <div className={styles.statValue}>{players.length - bannedCount}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statYellow}`}>
              <div className={styles.statLabel}>Plataformas</div>
              <div className={styles.statValue}>3</div>
            </div>
          </div>

          {/* Bans recentes */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Bans recentes</h2>
            <div className="card">
              {players.filter(p => p.is_banned).length === 0 ? (
                <div className={styles.emptyBans}>Nenhum ban detectado ainda 🎉</div>
              ) : (
                players.filter(p => p.is_banned).flatMap(p =>
                  (p.bans || []).map((b, i) => (
                    <div key={`${p.id}-${i}`} className={styles.banRow}>
                      <img src={p.avatar_url || '/default-avatar.png'} className={styles.banAvatar} alt="" />
                      <div className={styles.banInfo}>
                        <span className={styles.banName}>{p.display_name}</span>
                        <span className={styles.banPlatform}>{b.platform} · {b.ban_type}</span>
                      </div>
                      <span className={styles.banDate}>
                        {new Date(b.detected_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))
                )
              )}
            </div>
          </section>

          {/* Minha Lista */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Minha Lista</h2>
            <div className="card">
              {players.length === 0 ? (
                <div className={styles.emptyBans}>Nenhum jogador adicionado ainda</div>
              ) : (
                <table className={styles.playerTable}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Nickname</th>
                      <th>Link Steam</th>
                      <th>Adicionado em</th>
                      <th>Status</th>
                      <th>Plataforma / Tipo</th>
                      <th>Data do Ban</th>
                      <th>Jogos</th>
                      <th>Listas</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img
                            src={p.avatar_url || '/default-avatar.png'}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: '50%' }}
                          />
                        </td>
                        <td className={styles.playerName}>{p.display_name}</td>
                        <td>
                          <a
                            href={p.steam_profile_url || `https://steamcommunity.com/profiles/${p.steam_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.steamLink}
                          >
                            Ver perfil ↗
                          </a>
                        </td>
                        <td className={styles.playerDate}>
                          {new Date(p.added_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <span className={p.is_banned ? styles.statusBanned : styles.statusClean}>
                            {p.is_banned ? 'BANIDO' : 'Limpo'}
                          </span>
                        </td>
                        <td>
                          {p.bans && p.bans.length > 0 ? (
                            <div className={styles.banPlatforms}>
                              {p.bans.map((b, i) => (
                                <span key={i} className={styles.banPlatformPill}>
                                  {b.platform === 'steam' ? '🛡️ Steam' :
                                   b.platform === 'faceit' ? '⚡ FACEIT' :
                                   '🎮 GC'} · {b.ban_type}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles.playerDate}>—</span>
                          )}
                        </td>
                        <td className={styles.playerDate}>
                          {p.bans && p.bans.length > 0
                            ? (p.bans[0].ban_date
                                ? new Date(p.bans[0].ban_date + 'T00:00:00').toLocaleDateString('pt-BR')
                                : new Date(p.bans[0].detected_at).toLocaleDateString('pt-BR'))
                            : '—'}
                        </td>
                        <td>
                          {p.bans && p.bans.length > 0 && p.bans[0].details?.games?.length > 0 ? (
                            <div className={styles.banGames}>
                              {p.bans[0].details.games.map((g, i) => (
                                <span key={i} className={styles.gamePill}>
                                  {g.name} ({g.hours}h)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles.playerDate}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={styles.listCount}>
                            {listCounts[p.steam_id] || 1}
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleRemove(p.id)}
                            title="Remover jogador"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Plataformas */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Plataformas monitoradas</h2>
            <div className={styles.platformGrid}>
              {[
                { name: 'Steam (CS2)', icon: '🛡️', color: '#66C0F4' },
                { name: 'FACEIT', icon: '⚡', color: '#FF5500' },
                { name: 'Gamer Club Brasil', icon: '🎮', color: '#00C9A7' },
              ].map(p => (
                <div key={p.name} className={styles.platformCard} style={{ borderColor: p.color + '44' }}>
                  <span style={{ fontSize: 26 }}>{p.icon}</span>
                  <div>
                    <div className={styles.platformName}>{p.name}</div>
                    <div className={styles.platformStatus} style={{ color: p.color }}>● Ativo</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Modal: Adicionar jogador */}
      {addOpen && (
        <div className={styles.overlay} onClick={() => setAddOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setAddOpen(false)}>✕</button>
            <h2 className={styles.modalTitle}>Adicionar jogador</h2>
            <p className={styles.modalSub}>Cole o link do perfil Steam ou o ID</p>
            <textarea
              className={styles.steamInput}
              placeholder={"https://steamcommunity.com/id/username\nou STEAM_0:0:12345678"}
              value={steamInput}
              onChange={e => setSteamInput(e.target.value)}
            />
            {addError && <div className={styles.addError}>{addError}</div>}
            <button
              className="btn btn-primary w-full"
              onClick={handleAddPlayer}
              disabled={adding}
              style={{ justifyContent: 'center', marginTop: 8 }}
            >
              {adding ? 'Adicionando...' : 'Adicionar e monitorar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
