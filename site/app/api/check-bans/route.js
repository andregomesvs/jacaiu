// site/app/api/check-bans/route.js
// Verificação manual de bans — chamado pelo dashboard ou ao adicionar jogador
// Diferente do cron: verifica jogadores específicos, não todos

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

export async function POST(request) {
  try {
    // Verifica se o usuário está autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, checkAll } = body;

    let playersToCheck = [];

    if (checkAll) {
      // Verifica todos os jogadores do usuário
      const { data } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('user_id', user.id);
      playersToCheck = data || [];
    } else if (playerId) {
      // Verifica um jogador específico
      const { data } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('id', playerId)
        .eq('user_id', user.id)
        .single();
      if (data) playersToCheck = [data];
    }

    if (playersToCheck.length === 0) {
      return Response.json({ checked: 0, bans: [] });
    }

    const allNewBans = [];

    for (const player of playersToCheck) {
      const newBans = await checkAllBansForPlayer(player);
      allNewBans.push(...newBans);
    }

    return Response.json({
      checked: playersToCheck.length,
      bansFound: allNewBans.length,
      bans: allNewBans,
    });

  } catch (error) {
    console.error('Erro na verificação manual:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// Verificar todos os bans de um jogador
// ============================================
async function checkAllBansForPlayer(player) {
  console.log(`Verificando bans: ${player.display_name} (${player.steam_id})`);

  const steamId = convertToSteam64(player.steam_id);
  if (!steamId) {
    console.error('Steam ID inválido:', player.steam_id);
    return [];
  }

  const [steamResult, faceitResult, gamerclubResult] = await Promise.all([
    checkSteamBan(steamId),
    checkFaceitBan(steamId),
    checkGamerClubBan(steamId),
  ]);

  console.log('Resultados:', { steam: steamResult, faceit: faceitResult, gamerclub: gamerclubResult });

  const results = [
    { platform: 'steam', result: steamResult },
    { platform: 'faceit', result: faceitResult },
    { platform: 'gamerclub', result: gamerclubResult },
  ];

  const newBans = [];

  for (const { platform, result } of results) {
    if (!result || !result.banned) continue;

    // Verifica se já foi registrado
    const { data: existingBan } = await supabaseAdmin
      .from('bans')
      .select('id')
      .eq('player_id', player.id)
      .eq('platform', platform)
      .maybeSingle();

    if (existingBan) continue;

    // Registra novo ban
    const { data: newBan, error } = await supabaseAdmin
      .from('bans')
      .insert({
        player_id: player.id,
        platform,
        ban_type: result.type,
        ban_date: result.banDate || null,
        details: result.details || {},
      })
      .select()
      .single();

    if (!error && newBan) {
      newBans.push(newBan);
    }
  }

  // Atualiza status do jogador
  const hasAnyBan = newBans.length > 0 || (await hasExistingBan(player.id));
  await supabaseAdmin
    .from('players')
    .update({
      is_banned: hasAnyBan,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', player.id);

  return newBans;
}

// ============================================
// Steam Ban Check
// ============================================
async function checkSteamBan(steam64) {
  try {
    if (!STEAM_API_KEY) { console.warn('STEAM_API_KEY não configurada'); return null; }

    // Busca bans
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${steam64}`
    );
    const data = await res.json();
    const player = data?.players?.[0];
    if (!player) return null;

    console.log('Steam API response:', JSON.stringify(player, null, 2));

    if (player.VACBanned || player.NumberOfGameBans > 0) {
      // Calcula a data real do ban a partir de DaysSinceLastBan
      const daysSince = player.DaysSinceLastBan || 0;
      console.log('DaysSinceLastBan:', daysSince);
      const banDate = new Date();
      banDate.setDate(banDate.getDate() - daysSince);
      const banDateStr = banDate.toISOString().split('T')[0]; // YYYY-MM-DD
      console.log('Data calculada do ban:', banDateStr);

      // Monta descrição do tipo de ban
      const banTypes = [];
      if (player.VACBanned) banTypes.push(`VAC Ban (${player.NumberOfVACBans}x)`);
      if (player.NumberOfGameBans > 0) banTypes.push(`Game Ban (${player.NumberOfGameBans}x)`);
      const type = banTypes.join(' + ');

      // Busca jogos do perfil para dar contexto
      const games = await fetchSteamGames(steam64);

      return {
        banned: true,
        type,
        banDate: banDateStr,
        details: {
          vacBanned: player.VACBanned,
          numberOfVACBans: player.NumberOfVACBans || 0,
          gameBans: player.NumberOfGameBans,
          daysSinceLastBan: player.DaysSinceLastBan,
          communityBanned: player.CommunityBanned,
          economyBan: player.EconomyBan,
          games: games || [],
        },
      };
    }
    return { banned: false };
  } catch (err) {
    console.error('Erro Steam ban check:', err);
    return null;
  }
}

// Busca os jogos do perfil Steam (para contexto do ban)
async function fetchSteamGames(steam64) {
  try {
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steam64}&include_appinfo=1&include_played_free_games=1`
    );
    const data = await res.json();
    const games = data?.response?.games || [];

    // Retorna os 5 jogos mais jogados (por horas)
    return games
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 5)
      .map(g => ({
        name: g.name,
        appid: g.appid,
        hours: Math.round((g.playtime_forever || 0) / 60),
      }));
  } catch {
    return [];
  }
}

// ============================================
// FACEIT Ban Check
// ============================================
async function checkFaceitBan(steam64) {
  try {
    if (!FACEIT_API_KEY) return { banned: false };

    const searchRes = await fetch(
      `https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${steam64}`,
      { headers: { Authorization: `Bearer ${FACEIT_API_KEY}` } }
    );
    if (!searchRes.ok) return { banned: false };

    const player = await searchRes.json();
    if (!player?.player_id) return { banned: false };

    const banRes = await fetch(
      `https://open.faceit.com/data/v4/players/${player.player_id}/bans`,
      { headers: { Authorization: `Bearer ${FACEIT_API_KEY}` } }
    );
    const banData = await banRes.json();
    const activeBans = banData?.items?.filter(b => b.status === 'active') || [];

    if (activeBans.length > 0) {
      return { banned: true, type: activeBans[0].reason || 'Ban', details: activeBans[0] };
    }
    return { banned: false };
  } catch (err) {
    console.error('Erro FACEIT ban check:', err);
    return null;
  }
}

// ============================================
// Gamer Club Ban Check
// ============================================
async function checkGamerClubBan(steam64) {
  try {
    const res = await fetch(
      `https://csgo.gc.gg/api/v1/player/profile?steamId=${steam64}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
    );
    if (!res.ok) return { banned: false };

    const data = await res.json();
    if (data?.isBanned || data?.ban?.active) {
      return { banned: true, type: data?.ban?.reason || 'Ban', details: data?.ban };
    }
    return { banned: false };
  } catch (err) {
    console.error('Erro GamerClub ban check:', err);
    return null;
  }
}

// ============================================
// Utilitários
// ============================================
function convertToSteam64(steamId) {
  try {
    if (/^\d{17}$/.test(steamId)) return steamId;
    const urlMatch = steamId.match(/steamcommunity\.com\/(?:id|profiles)\/([^/]+)/);
    if (urlMatch) return urlMatch[1];
    const match = steamId.match(/^STEAM_\d:(\d):(\d+)$/);
    if (match) {
      const y = BigInt(match[1]);
      const z = BigInt(match[2]);
      return (z * 2n + 76561197960265728n + y).toString();
    }
    return null;
  } catch { return null; }
}

async function hasExistingBan(playerId) {
  const { data } = await supabaseAdmin
    .from('bans')
    .select('id')
    .eq('player_id', playerId)
    .limit(1);
  return (data?.length || 0) > 0;
}
