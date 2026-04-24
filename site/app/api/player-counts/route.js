// site/app/api/player-counts/route.js
// Retorna quantas listas cada jogador está sendo monitorado
// Usa service role para contar entre todos os usuários

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { steamIds } = await request.json();

    if (!steamIds || !Array.isArray(steamIds) || steamIds.length === 0) {
      return Response.json({});
    }

    // Conta quantos usuários diferentes monitoram cada steam_id
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('steam_id')
      .in('steam_id', steamIds);

    if (error) {
      console.error('Erro ao contar listas:', error);
      return Response.json({});
    }

    // Agrupa e conta por steam_id
    const counts = {};
    for (const row of data || []) {
      counts[row.steam_id] = (counts[row.steam_id] || 0) + 1;
    }

    return Response.json(counts);
  } catch (err) {
    console.error('Erro na API player-counts:', err);
    return Response.json({}, { status: 500 });
  }
}
