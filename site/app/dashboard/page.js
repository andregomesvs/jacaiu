'use client';
// site/app/dashboard/page.js

import { useState, useEffect } from 'react';
import { supabase, getPlayers, addPlayer, removePlayer, getProfile } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import GamingBackground from '../components/GamingBackground';
import { Crosshair, Radar, Swords, Soldier, Target, Plus, Logout } from '../components/Icons';

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
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState('');
  const [listCounts, setListCounts] = useState({});
  const [activeNav, setActiveNav] = useState('home');

  async function ensureProfile(user) {
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!data) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      await supabase.from('profiles').upsert({
        id: user.id,
        username: name,
        avatar_url: user.user_metadata?.avatar_url || null,
      }, { onConflict: 'id' });
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      // Garante que o profile existe antes de carregar dados
      await ensureProfile(user);
      loadData(user.id);
    });

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
      getProfile(userId),
    ]);
    if (playersRes.data) {
      setPlayers(playersRes.data);
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
    } catch {}
  }

  async function handleAddPlayer() {
    if (!steamInput.trim()) return;
    setAdding(true);
    setAddError('');
    const { data, error } = await addPlayer(user.id, steamInput);
    if (error) {
      setAddError(error.message.includes('duplicate') ? 'Jogador já está na sua lista!' : error.message);
    } else {
      setPlayers(prev => [{ ...data, bans: [] }, ...prev]);
      setSteamInput('');
      setAddOpen(false);
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
      await loadData(user.id);
    } catch {
      setCheckResult('Erro ao verificar bans.');
    }
    setChecking(false);
    setTimeout(() => setCheckResult(''), 5000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const bannedPlayers = players.filter(p => p.is_banned);
  const cleanPlayers = players.filter(p => !p.is_banned);
  const bannedCount = bannedPlayers.length;

  // Debug: verificar dados dos jogadores
  console.log('[Dashboard] players:', players.length, players);

  // Cores de avatar baseadas na inicial
  const avatarColors = ['#1A2332', '#1A2332', '#1A2332', '#1A2332', '#1A2332', '#1A2332'];
  const avatarTextColors = ['#FF4655', '#4ADE80', '#3B82F6', '#FBBF24', '#A78BFA', '#F97316'];
  function getAvatarColor(name) {
    const i = (name || 'A').charCodeAt(0) % avatarColors.length;
    return { bg: avatarColors[i], text: avatarTextColors[i] };
  }

  if (loading) return (
    <div className={styles.loadingScreen}>
      <GamingBackground />
      <div className={styles.loadingSpinner} />
      <div className={styles.loadingText}>Carregando...</div>
    </div>
  );

  return (
    <div className={styles.root}>
      <GamingBackground />

      {/* Top Nav */}
      <div className={styles.topNav}>
        <div className={styles.logoWrap}>
          <div className={styles.logoBox}>JC</div>
          <span className={styles.logoText}>JA CAIU<span className={styles.logoAccent}>?</span></span>
        </div>
        <div className={styles.topNavRight}>
          <button
            className={styles.checkBtn}
            onClick={() => checkBans()}
            disabled={checking}
          >
            <Target size={14} color="currentColor" />
            {checking ? 'Verificando...' : 'Scan'}
          </button>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className={styles.userAvatar} alt="" />
          ) : (
            <div className={styles.userAvatarInitials}>
              {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Check result */}
        {checkResult && <div className={styles.checkResult}>{checkResult}</div>}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statValue}>{players.length}</div>
            <div className={styles.statLabel}>Monitorados</div>
          </div>
          <div className={`${styles.statCard} ${styles.statRed}`}>
            <div className={styles.statValue}>{bannedCount}</div>
            <div className={styles.statLabel}>Banidos</div>
          </div>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statValue}>{players.length - bannedCount}</div>
            <div className={styles.statLabel}>Limpos</div>
          </div>
        </div>

        {/* Bans recentes */}
        {bannedPlayers.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Bans recentes</span>
            </div>
            <div className={styles.playerList}>
              {bannedPlayers.map(p => {
                const colors = getAvatarColor(p.display_name);
                const ban = p.bans?.[0];
                return (
                  <div
                    key={p.id}
                    className={styles.playerItem}
                    onClick={() => setSelectedPlayer(p)}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className={styles.playerAvatar} alt="" />
                    ) : (
                      <div
                        className={styles.playerAvatarFallback}
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {(p.display_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={styles.playerInfo}>
                      <div className={styles.playerName}>{p.display_name}</div>
                      <div className={styles.playerBanDetail}>
                        {ban?.ban_type || 'Ban detectado'}
                        {ban?.ban_date && ` · ${new Date(ban.ban_date + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div className={styles.playerRight}>
                      <span className={`${styles.badge} ${styles.badgeBanned}`}>Banido</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Minha Lista */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Minha lista</span>
            <span className={styles.listCount}>{players.length} jogadores</span>
          </div>
          {players.length === 0 ? (
            <div className={styles.playerList}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>&#x1F3AE;</div>
                <div className={styles.emptyText}>Nenhum jogador monitorado</div>
                <button className={styles.emptyBtn} onClick={() => setAddOpen(true)}>
                  + Adicionar jogador
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.playerList}>
              {players.map(p => {
                const colors = getAvatarColor(p.display_name);
                return (
                  <div
                    key={p.id}
                    className={styles.playerItem}
                    onClick={() => setSelectedPlayer(p)}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className={styles.playerAvatar} alt="" />
                    ) : (
                      <div
                        className={styles.playerAvatarFallback}
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {(p.display_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={styles.playerInfo}>
                      <div className={styles.playerName}>{p.display_name}</div>
                      <div className={styles.playerSub}>
                        Adicionado {new Date(p.added_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className={styles.playerRight}>
                      <span className={`${styles.badge} ${p.is_banned ? styles.badgeBanned : styles.badgeClean}`}>
                        {p.is_banned ? 'Banido' : 'Limpo'}
                      </span>
                      {listCounts[p.steam_id] > 1 && (
                        <span className={styles.listCount}>
                          {listCounts[p.steam_id]} listas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <button
          className={activeNav === 'home' ? styles.navItemActive : styles.navItem}
          onClick={() => setActiveNav('home')}
        >
          <Crosshair size={20} color="currentColor" />
          Home
        </button>
        <button
          className={activeNav === 'lista' ? styles.navItemActive : styles.navItem}
          onClick={() => setActiveNav('lista')}
        >
          <Radar size={20} color="currentColor" />
          Lista
        </button>
        <button className={styles.fab} onClick={() => setAddOpen(true)}>
          <Plus size={22} color="#fff" />
        </button>
        <button
          className={activeNav === 'alertas' ? styles.navItemActive : styles.navItem}
          onClick={() => setActiveNav('alertas')}
        >
          <Swords size={20} color="currentColor" />
          Alertas
        </button>
        <button className={styles.navItem} onClick={handleSignOut}>
          <Logout size={20} color="currentColor" />
          Sair
        </button>
      </nav>

      {/* Modal: Adicionar jogador */}
      {addOpen && (
        <div className={styles.overlay} onClick={() => setAddOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <button className={styles.modalClose} onClick={() => setAddOpen(false)}>&#x2715;</button>
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
              className={styles.addBtn}
              onClick={handleAddPlayer}
              disabled={adding}
            >
              {adding ? 'Adicionando...' : 'Adicionar e monitorar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Detalhe do jogador */}
      {selectedPlayer && (
        <div className={styles.overlay} onClick={() => setSelectedPlayer(null)}>
          <div className={styles.detailSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <button className={styles.modalClose} onClick={() => setSelectedPlayer(null)}>&#x2715;</button>

            <div className={styles.detailHeader}>
              {selectedPlayer.avatar_url ? (
                <img src={selectedPlayer.avatar_url} className={styles.detailAvatar} alt="" />
              ) : (
                <div
                  className={styles.detailAvatarFallback}
                  style={{
                    background: getAvatarColor(selectedPlayer.display_name).bg,
                    color: getAvatarColor(selectedPlayer.display_name).text,
                  }}
                >
                  {(selectedPlayer.display_name || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className={styles.detailName}>{selectedPlayer.display_name}</div>
                <div className={styles.detailId}>{selectedPlayer.steam_id}</div>
                <div style={{ marginTop: 6 }}>
                  <span className={`${styles.badge} ${selectedPlayer.is_banned ? styles.badgeBanned : styles.badgeClean}`}>
                    {selectedPlayer.is_banned ? 'Banido' : 'Limpo'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Plataforma</span>
              <span className={styles.detailValue}>
                {selectedPlayer.bans?.[0]?.platform === 'steam' ? 'Steam' :
                 selectedPlayer.bans?.[0]?.platform === 'faceit' ? 'FACEIT' :
                 selectedPlayer.bans?.[0]?.platform || 'Steam'}
              </span>
            </div>

            {selectedPlayer.is_banned && selectedPlayer.bans?.[0] && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tipo de ban</span>
                  <span className={styles.detailValueDanger}>
                    {selectedPlayer.bans[0].ban_type}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Data do ban</span>
                  <span className={styles.detailValue}>
                    {selectedPlayer.bans[0].ban_date
                      ? new Date(selectedPlayer.bans[0].ban_date + 'T00:00:00').toLocaleDateString('pt-BR')
                      : new Date(selectedPlayer.bans[0].detected_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </>
            )}

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Monitorado por</span>
              <span className={styles.detailValue}>
                {listCounts[selectedPlayer.steam_id] || 1} usuario(s)
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Adicionado em</span>
              <span className={styles.detailValue}>
                {new Date(selectedPlayer.added_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {selectedPlayer.bans?.[0]?.details?.games?.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E', padding: '14px 0 6px' }}>
                  Jogos mais jogados
                </div>
                <div className={styles.detailGames}>
                  {selectedPlayer.bans[0].details.games.map((g, i) => (
                    <span key={i} className={styles.gamePill}>
                      {g.name} ({g.hours}h)
                    </span>
                  ))}
                </div>
              </>
            )}

            <a
              href={selectedPlayer.steam_profile_url || `https://steamcommunity.com/profiles/${selectedPlayer.steam_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', padding: '12px',
                borderRadius: 12, background: '#DBEAFE', color: '#2563EB',
                fontSize: 14, fontWeight: 600, marginTop: 8, textDecoration: 'none',
              }}
            >
              Ver perfil na Steam
            </a>

            <button className={styles.removeBtn} onClick={() => handleRemove(selectedPlayer.id)}>
              Remover da lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
