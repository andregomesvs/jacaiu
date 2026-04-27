// site/lib/supabaseClient.js
// Cliente Supabase para o site (cópia local do backend/supabaseClient.js)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// AUTH
// ============================================

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Steam helpers
export function isSteamUser(user) {
  return user?.user_metadata?.steam_id != null;
}

export function getSteamId(user) {
  return user?.user_metadata?.steam_id || null;
}

export function getSteamDisplayName(user) {
  return user?.user_metadata?.steam_display_name || null;
}

// ============================================
// PLAYERS
// ============================================

export async function getPlayers(userId) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      bans (
        id,
        platform,
        ban_type,
        ban_date,
        detected_at,
        details
      )
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  return { data, error };
}

export async function addPlayer(userId, steamInput) {
  const steamId = parseSteamInput(steamInput);
  if (!steamId) {
    return { error: { message: 'Steam ID ou URL inválido' } };
  }

  console.log('[addPlayer] steamId parsed:', steamId);
  const profile = await fetchSteamProfile(steamId);
  console.log('[addPlayer] profile response:', JSON.stringify(profile));

  // Usa o Steam64 resolvido pela API (importante para vanity URLs como /id/username)
  const resolvedSteamId = profile?.steam64 || steamId;
  console.log('[addPlayer] resolvedSteamId:', resolvedSteamId);

  const { data, error } = await supabase
    .from('players')
    .insert({
      user_id: userId,
      steam_id: resolvedSteamId,
      steam_profile_url: `https://steamcommunity.com/profiles/${resolvedSteamId}`,
      display_name: profile?.personaname || 'Jogador Steam',
      avatar_url: profile?.avatarfull || null,
    })
    .select()
    .single();

  return { data, error };
}

export async function removePlayer(playerId) {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);
  return { error };
}

// ============================================
// PROFILE
// ============================================

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export async function uploadAvatar(userId, file) {
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError };

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return { url: publicUrl };
}

// ============================================
// Utilitários
// ============================================

function parseSteamInput(input) {
  input = input.trim();

  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) return profileMatch[1];

  const vanityMatch = input.match(/steamcommunity\.com\/id\/([^/\s]+)/);
  if (vanityMatch) return vanityMatch[1];

  if (/^\d{17}$/.test(input)) return input;
  if (/^STEAM_\d:\d:\d+$/.test(input)) return input;

  return null;
}

async function fetchSteamProfile(steamId) {
  try {
    const response = await fetch(`/api/steam/profile?steamId=${steamId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
