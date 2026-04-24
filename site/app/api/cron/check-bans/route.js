// site/app/api/cron/check-bans/route.js
// Cron job que roda a cada hora para verificar bans
// Configurado no vercel.json para rodar automaticamente

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos máximo

export async function GET(request) {
  // Verifica token de segurança para evitar chamadas não autorizadas
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { runBanCheck } = require('../../../../../backend/banChecker');
    await runBanCheck();
    return Response.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro no cron job:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
