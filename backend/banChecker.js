// ============================================
// JÁ CAIU? — Serviço de Verificação de Bans
// Este arquivo é usado pelo site E pelo cron job
// ============================================

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usa service role para bypassar RLS
);

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================
// 1. STEAM — Verificar VAC Ban e Game Ban
// ============================================
async function checkSteamBan(steamId) {
  try {
    // Converte STEAM_0:X:XXXXXXXX para SteamID64
    const steam64 = convertToSteam64(steamId);
    if (!steam64) return null;

    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${process.env.STEAM_API_KEY}&steamids=${steam64}`
    );
    const data = await response.json();
    const player = data?.players?.[0];

    if (!player) return null;

    if (player.VACBanned || player.NumberOfGameBans > 0) {
      return {
        banned: true,
        type: player.VACBanned ? 'VAC Ban' : 'Game Ban',
        details: {
          vacBanned: player.VACBanned,
          gameBans: player.NumberOfGameBans,
          daysSinceLastBan: player.DaysSinceLastBan,
        }
      };
    }

    return { banned: false };
  } catch (error) {
    console.error('Erro ao verificar Steam:', error);
    return null;
  }
}

// ============================================
// 2. FACEIT — Verificar ban via API pública
// ============================================
async function checkFaceitBan(steamId) {
  try {
    const steam64 = convertToSteam64(steamId);
    if (!steam64) return null;

    // Busca jogador pelo Steam ID
    const searchRes = await fetch(
      `https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${steam64}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
        }
      }
    );

    if (!searchRes.ok) return { banned: false };

    const player = await searchRes.json();
    if (!player?.player_id) return { banned: false };

    // Verifica bans
    const banRes = await fetch(
      `https://open.faceit.com/data/v4/players/${player.player_id}/bans`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
        }
      }
    );

    const banData = await banRes.json();
    const activeBans = banData?.items?.filter(b => b.status === 'active') || [];

    if (activeBans.length > 0) {
      return {
        banned: true,
        type: activeBans[0].reason || 'Ban',
        faceit_id: player.player_id,
        details: activeBans[0]
      };
    }

    return { banned: false, faceit_id: player.player_id };
  } catch (error) {
    console.error('Erro ao verificar FACEIT:', error);
    return null;
  }
}

// ============================================
// 3. GAMER CLUB — Verificar ban (scraping/API)
// ============================================
async function checkGamerClubBan(steamId) {
  try {
    const steam64 = convertToSteam64(steamId);
    if (!steam64) return null;

    // Gamer Club não tem API pública oficial
    // Usa endpoint público de busca por perfil
    const response = await fetch(
      `https://csgo.gc.gg/api/v1/player/profile?steamId=${steam64}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) return { banned: false };

    const data = await response.json();

    if (data?.isBanned || data?.ban?.active) {
      return {
        banned: true,
        type: data?.ban?.reason || 'Ban',
        details: data?.ban
      };
    }

    return { banned: false };
  } catch (error) {
    console.error('Erro ao verificar Gamer Club:', error);
    return null;
  }
}

// ============================================
// 4. Verificar todos os bans de um jogador
// ============================================
async function checkAllBans(player) {
  console.log(`Verificando: ${player.display_name} (${player.steam_id})`);

  const [steamResult, faceitResult, gamerclubResult] = await Promise.all([
    checkSteamBan(player.steam_id),
    checkFaceitBan(player.steam_id),
    checkGamerClubBan(player.steam_id),
  ]);

  const results = [
    { platform: 'steam', label: 'Steam (CS2)', result: steamResult },
    { platform: 'faceit', label: 'FACEIT', result: faceitResult },
    { platform: 'gamerclub', label: 'Gamer Club Brasil', result: gamerclubResult },
  ];

  const newBans = [];

  for (const { platform, label, result } of results) {
    if (!result || !result.banned) continue;

    // Verifica se esse ban já foi registrado
    const { data: existingBan } = await supabase
      .from('bans')
      .select('id')
      .eq('player_id', player.id)
      .eq('platform', platform)
      .single();

    if (existingBan) continue; // Ban já registrado, não notifica de novo

    // Registra o novo ban
    const { data: newBan, error } = await supabase
      .from('bans')
      .insert({
        player_id: player.id,
        platform,
        ban_type: result.type,
        details: result.details || {},
      })
      .select()
      .single();

    if (!error && newBan) {
      newBans.push({ ...newBan, platformLabel: label });
    }
  }

  // Atualiza status geral do jogador
  const isBanned = newBans.length > 0 || (await hasExistingBan(player.id));
  await supabase
    .from('players')
    .update({
      is_banned: isBanned,
      last_checked_at: new Date().toISOString()
    })
    .eq('id', player.id);

  return newBans;
}

// ============================================
// 5. Cron Job — Verifica todos os jogadores
// ============================================
async function runBanCheck() {
  console.log('🔍 Iniciando verificação de bans...');

  // Busca jogadores que não foram verificados na última hora
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: players, error } = await supabase
    .from('players')
    .select('*, profiles(email, email_alerts, push_alerts, onesignal_player_id)')
    .lt('last_checked_at', oneHourAgo)
    .limit(100); // Processa 100 por vez para não sobrecarregar

  if (error) {
    console.error('Erro ao buscar jogadores:', error);
    return;
  }

  console.log(`Verificando ${players?.length || 0} jogadores...`);

  for (const player of players || []) {
    const newBans = await checkAllBans(player);

    // Se encontrou novos bans, envia notificações
    for (const ban of newBans) {
      const profile = player.profiles;

      if (profile?.email_alerts && profile?.email) {
        await sendEmailAlert(profile.email, player, ban);
      }

      if (profile?.push_alerts && profile?.onesignal_player_id) {
        await sendPushNotification(profile.onesignal_player_id, player, ban);
      }
    }

    // Pausa pequena para não sobrecarregar as APIs
    await sleep(500);
  }

  console.log('✅ Verificação concluída!');
}

// ============================================
// 6. Enviar e-mail de alerta
// ============================================
async function sendEmailAlert(email, player, ban) {
  try {
    await resend.emails.send({
      from: 'Já Caiu? <alertas@jacaiu.app>',
      to: email,
      subject: `🚨 ${player.display_name} foi banido no ${ban.platformLabel}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: monospace; background: #0A0A0A; color: #E0E0E0; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 40px auto; background: #111; border: 1px solid #222; border-radius: 16px; overflow: hidden; }
            .header { background: #FF3D5715; border-bottom: 1px solid #FF3D5730; padding: 28px; text-align: center; }
            .logo { font-size: 13px; color: #00FF87; letter-spacing: 2px; margin-bottom: 8px; }
            .title { font-size: 22px; font-weight: 700; color: #fff; }
            .body { padding: 28px; }
            .player-card { background: #1A1A1A; border-radius: 10px; padding: 16px; margin: 16px 0; display: flex; align-items: center; gap: 14px; }
            .avatar { width: 48px; height: 48px; border-radius: 8px; }
            .player-name { font-size: 16px; font-weight: 700; color: #fff; }
            .steam-id { font-size: 11px; color: #444; margin-top: 3px; }
            .ban-badge { background: #FF3D57; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; margin: 12px 0; }
            .platform { font-size: 13px; color: #888; margin-top: 8px; }
            .footer { padding: 20px 28px; border-top: 1px solid #1A1A1A; text-align: center; font-size: 11px; color: #333; }
            .btn { display: inline-block; background: #00FF87; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⬇ JÁ CAIU?</div>
              <div class="title">🚨 Ban Detectado!</div>
            </div>
            <div class="body">
              <p style="color:#888; font-size:13px;">Um jogador da sua lista foi banido:</p>
              <div class="player-card">
                ${player.avatar_url ? `<img src="${player.avatar_url}" class="avatar" />` : ''}
                <div>
                  <div class="player-name">${player.display_name}</div>
                  <div class="steam-id">${player.steam_id}</div>
                </div>
              </div>
              <div class="ban-badge">🚫 ${ban.ban_type}</div>
              <div class="platform">Plataforma: <strong style="color:#fff">${ban.platformLabel}</strong></div>
              <div class="platform">Detectado em: <strong style="color:#fff">${new Date().toLocaleDateString('pt-BR')}</strong></div>
              <br/>
              <a href="https://jacaiu.app/lista" class="btn">Ver na minha lista →</a>
            </div>
            <div class="footer">
              Você está recebendo este e-mail porque tem alertas ativados no Já Caiu?<br/>
              <a href="https://jacaiu.app/alertas" style="color:#444">Gerenciar alertas</a>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log(`📧 E-mail enviado para ${email}`);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
  }
}

// ============================================
// 7. Enviar notificação push (OneSignal)
// ============================================
async function sendPushNotification(playerId, player, ban) {
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
        headings: { pt: '🚨 Já Caiu!' },
        contents: { pt: `${player.display_name} foi banido no ${ban.platformLabel}!` },
        data: { player_id: player.id, ban_id: ban.id },
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
      })
    });
    console.log(`🔔 Push enviado para dispositivo ${playerId}`);
  } catch (error) {
    console.error('Erro ao enviar push:', error);
  }
}

// ============================================
// Utilitários
// ============================================

// Converte Steam ID formato STEAM_0:X:XXXXXXXX para Steam64
function convertToSteam64(steamId) {
  try {
    // Se já é Steam64
    if (/^\d{17}$/.test(steamId)) return steamId;

    // Se é URL do Steam
    const urlMatch = steamId.match(/steamcommunity\.com\/(?:id|profiles)\/([^/]+)/);
    if (urlMatch) return urlMatch[1]; // Retorna o ID (pode ser vanity URL, precisa resolver)

    // Se é formato STEAM_0:Y:Z
    const match = steamId.match(/^STEAM_\d:(\d):(\d+)$/);
    if (match) {
      const y = BigInt(match[1]);
      const z = BigInt(match[2]);
      return (z * 2n + 76561197960265728n + y).toString();
    }

    return null;
  } catch {
    return null;
  }
}

async function hasExistingBan(playerId) {
  const { data } = await supabase
    .from('bans')
    .select('id')
    .eq('player_id', playerId)
    .limit(1);
  return (data?.length || 0) > 0;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  checkAllBans,
  checkSteamBan,
  checkFaceitBan,
  checkGamerClubBan,
  runBanCheck,
  sendEmailAlert,
  sendPushNotification,
  convertToSteam64,
};
