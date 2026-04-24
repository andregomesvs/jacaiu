// site/app/api/cron/check-bans/route.js
// Cron job diário para verificar bans de todos os jogadores
// Configurado no vercel.json

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export async function GET(request) {
  // Verifica se é chamada da Vercel Cron (ou com token manual)
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    console.log('Iniciando verificação diária de bans...');

    // Busca todos os jogadores
    const { data: players, error } = await supabaseAdmin
      .from('players')
      .select('*')
      .limit(200);

    if (error) {
      console.error('Erro ao buscar jogadores:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log(`Verificando ${players?.length || 0} jogadores...`);

    let totalBans = 0;

    for (const player of players || []) {
      const steamId = convertToSteam64(player.steam_id);
      if (!steamId) continue;

      const steamResult = await checkSteamBan(steamId);

      if (steamResult?.banned) {
        // Verifica se já foi registrado
        const { data: existing } = await supabaseAdmin
          .from('bans')
          .select('id')
          .eq('player_id', player.id)
          .eq('platform', 'steam')
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from('bans').insert({
            player_id: player.id,
            platform: 'steam',
            ban_type: steamResult.type,
            ban_date: steamResult.banDate || null,
            details: steamResult.details || {},
          });
          totalBans++;
        }
      }

      // Atualiza status
      const hasBan = steamResult?.banned || (await hasExistingBan(player.id));
      await supabaseAdmin
        .from('players')
        .update({ is_banned: hasBan, last_checked_at: new Date().toISOString() })
        .eq('id', player.id);

      // Pausa para não sobrecarregar API
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`Verificação concluída! ${totalBans} novos bans encontrados.`);
    return Response.json({
      success: true,
      checked: players?.length || 0,
      newBans: totalBans,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro no cron:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function checkSteamBan(steam64) {
  try {
    if (!STEAM_API_KEY) return null;
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${steam64}`
    );
    const data = await res.json();
    const player = data?.players?.[0];
    if (!player) return null;

    if (player.VACBanned || player.NumberOfGameBans > 0) {
      const banDate = new Date();
      banDate.setDate(banDate.getDate() - (player.DaysSinceLastBan || 0));

      const banTypes = [];
      if (player.VACBanned) banTypes.push(`VAC Ban (${player.NumberOfVACBans}x)`);
      if (player.NumberOfGameBans > 0) banTypes.push(`Game Ban (${player.NumberOfGameBans}x)`);

      return {
        banned: true,
        type: banTypes.join(' + '),
        banDate: banDate.toISOString().split('T')[0],
        details: {
          vacBanned: player.VACBanned,
          numberOfVACBans: player.NumberOfVACBans || 0,
          gameBans: player.NumberOfGameBans,
          daysSinceLastBan: player.DaysSinceLastBan,
        },
      };
    }
    return { banned: false };
  } catch { return null; }
}

function convertToSteam64(steamId) {
  try {
    if (/^\d{17}$/.test(steamId)) return steamId;
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
