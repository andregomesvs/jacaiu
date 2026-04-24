// site/app/api/auth/steam/route.js
// Redireciona o usuário para o login da Steam via OpenID 2.0

import { NextResponse } from 'next/server';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Monta a URL base do site
  const origin = new URL(request.url).origin;
  const callbackUrl = `${origin}/api/auth/steam/callback`;

  // Parâmetros do OpenID 2.0 para Steam
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${callbackUrl}?returnTo=${encodeURIComponent(returnTo)}`,
    'openid.realm': origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}
