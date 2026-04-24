// site/app/api/auth/steam/callback/route.js
// Callback do Steam OpenID 2.0
// Verifica a autenticação, cria/encontra usuário no Supabase e gera sessão

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service role (acesso admin)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export async function GET(request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const returnTo = params.get('returnTo') || '/dashboard';
  const origin = url.origin;
  const isMobile = returnTo === '/auth/callback-mobile';

  try {
    // ============================================
    // 1. Verificar a resposta OpenID com a Steam
    // ============================================
    const isValid = await verifySteamOpenID(params);
    if (!isValid) {
      console.error('Steam OpenID verification failed');
      if (isMobile) return redirectMobileError('steam_verification_failed');
      return NextResponse.redirect(`${origin}/login?error=steam_verification_failed`);
    }

    // ============================================
    // 2. Extrair o Steam ID da resposta
    // ============================================
    const claimedId = params.get('openid.claimed_id');
    const steamIdMatch = claimedId?.match(/\/openid\/id\/(\d{17})$/);
    if (!steamIdMatch) {
      console.error('Invalid Steam ID in claimed_id:', claimedId);
      if (isMobile) return redirectMobileError('invalid_steam_id');
      return NextResponse.redirect(`${origin}/login?error=invalid_steam_id`);
    }
    const steamId = steamIdMatch[1];
    console.log('Steam ID autenticado:', steamId);

    // ============================================
    // 3. Buscar perfil Steam via API
    // ============================================
    const steamProfile = await fetchSteamProfile(steamId);
    const displayName = steamProfile?.personaname || `Steam_${steamId.slice(-6)}`;
    const avatarUrl = steamProfile?.avatarfull || null;
    console.log('Perfil Steam:', displayName);

    // ============================================
    // 4. Criar ou encontrar usuário no Supabase
    // ============================================
    const fakeEmail = `steam_${steamId}@jacaiu.steam`;
    let userId;

    // Primeiro: tenta encontrar na tabela profiles pelo steam_id
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('steam_id', steamId)
      .maybeSingle();

    if (existingProfile) {
      // Usuário já existe — só atualiza
      userId = existingProfile.id;
      console.log('Usuário existente encontrado:', userId);

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          steam_id: steamId,
          steam_display_name: displayName,
          avatar_url: avatarUrl,
        },
      });

      await supabaseAdmin.from('profiles').update({
        steam_display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

    } else {
      // Novo usuário — cria conta SEM user_metadata (para evitar conflito no trigger)
      console.log('Criando novo usuário para Steam ID:', steamId);

      // Primeiro, remove o trigger temporariamente para evitar conflitos
      // Cria o usuário com dados mínimos
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        email_confirm: true,
        user_metadata: {
          provider: 'steam',
          steam_id: steamId,
        },
      });

      if (createError) {
        console.error('Erro detalhado ao criar usuário:', JSON.stringify(createError, null, 2));

        // Se o erro for "user already exists", tenta encontrar pelo email
        if (createError.message?.includes('already') || createError.status === 422) {
          const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
          const found = allUsers?.users?.find(u => u.email === fakeEmail);
          if (found) {
            userId = found.id;
            console.log('Usuário já existia no auth:', userId);
          }
        }

        if (!userId) {
          if (isMobile) return redirectMobileError('user_creation_failed');
          return NextResponse.redirect(`${origin}/login?error=user_creation_failed`);
        }
      } else {
        userId = newUser.user.id;
        console.log('Usuário criado:', userId);
      }

      // Garante que o profile existe (o trigger pode ter falhado)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        // Insere manualmente se o trigger não criou
        console.log('Criando profile manualmente para:', userId);
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            username: displayName,
            steam_id: steamId,
            steam_display_name: displayName,
            avatar_url: avatarUrl,
            email_alerts: true,
            push_alerts: true,
          });

        if (profileError) {
          console.error('Erro ao criar profile:', profileError);
        }
      } else {
        // Atualiza o profile que o trigger criou
        await supabaseAdmin.from('profiles').update({
          steam_id: steamId,
          steam_display_name: displayName,
          avatar_url: avatarUrl,
          username: displayName,
        }).eq('id', userId);
      }
    }

    // ============================================
    // 5. Gerar sessão para o usuário
    // ============================================
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: fakeEmail,
    });

    if (linkError) {
      console.error('Erro ao gerar link de sessão:', linkError);
      if (isMobile) return redirectMobileError('session_failed');
      return NextResponse.redirect(`${origin}/login?error=session_failed`);
    }

    const hashedToken = linkData.properties?.hashed_token;

    // ============================================
    // 6. Redirecionar — web ou mobile
    // ============================================
    if (isMobile) {
      return NextResponse.redirect(`jacaiu://auth/callback?token_hash=${hashedToken}&type=magiclink`);
    }

    const verificationUrl = `${origin}/auth/callback?token_hash=${hashedToken}&type=magiclink&next=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(verificationUrl);

  } catch (err) {
    console.error('Erro no callback Steam:', err);
    if (isMobile) return redirectMobileError('steam_callback_error');
    return NextResponse.redirect(`${origin}/login?error=steam_callback_error`);
  }
}

function redirectMobileError(errorCode) {
  return NextResponse.redirect(`jacaiu://auth/callback?error=${errorCode}`);
}

// ============================================
// Verificar resposta OpenID com a Steam
// ============================================
async function verifySteamOpenID(params) {
  const verifyParams = new URLSearchParams();

  for (const [key, value] of params.entries()) {
    if (key.startsWith('openid.')) {
      verifyParams.set(key, value);
    }
  }

  verifyParams.set('openid.mode', 'check_authentication');

  const response = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  });

  const text = await response.text();
  return text.includes('is_valid:true');
}

// ============================================
// Buscar perfil Steam pela API
// ============================================
async function fetchSteamProfile(steamId) {
  if (!STEAM_API_KEY) return null;

  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
    );
    const data = await res.json();
    return data.response?.players?.[0] || null;
  } catch {
    return null;
  }
}
