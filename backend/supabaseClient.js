// ============================================
// JÁ CAIU? — Cliente Supabase compartilhado
// Usado tanto pelo site quanto pelo app
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// AUTH — Funções de autenticação
// ============================================

// Login com e-mail e senha
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

// Cadastro com e-mail e senha
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

// Login com Google (só no site)
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { data, error };
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Pegar usuário atual
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Verifica se o usuário logou via Steam
export function isSteamUser(user) {
  return user?.user_metadata?.steam_id != null;
}

// Pegar Steam ID do usuário logado
export function getSteamId(user) {
  return user?.user_metadata?.steam_id || null;
}

// Pegar nome Steam do usuário logado
export function getSteamDisplayName(user) {
  return user?.user_metadata?.steam_display_name || null;
}

// ============================================
// PLAYERS — Funções da lista de jogadores
// ============================================

// Buscar todos os jogadores do usuário
export async function getPlayers(userId) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      bans (
        id,
        platform,
        ban_type,
        detected_at
      )
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  return { data, error };
}

// Adicionar jogador pela URL/ID do Steam
export async function addPlayer(userId, steamInput) {
  // Limpa o input (pode ser URL ou ID direto)
  const steamId = parseSteamInput(steamInput);
  if (!steamId) {
    return { error: { message: 'Steam ID ou URL inválido' } };
  }

  // Busca informações do perfil Steam
  const profile = await fetchSteamProfile(steamId);

  const { data, error } = await supabase
    .from('players')
    .insert({
      user_id: userId,
      steam_id: steamId,
      steam_profile_url: `https://steamcommunity.com/profiles/${steamId}`,
      display_name: profile?.personaname || 'Jogador Steam',
      avatar_url: profile?.avatarfull || null,
    })
    .select()
    .single();

  return { data, error };
}

// Remover jogador
export async function removePlayer(playerId) {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);
  return { error };
}

// ============================================
// PROFILE — Funções do perfil do usuário
// ============================================

// Buscar perfil
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// Atualizar perfil
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// Upload de avatar
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

  // URL tipo: steamcommunity.com/profiles/76561198XXXXXXXXX
  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) return profileMatch[1];

  // URL tipo: steamcommunity.com/id/username (vanity)
  const vanityMatch = input.match(/steamcommunity\.com\/id\/([^/\s]+)/);
  if (vanityMatch) return vanityMatch[1]; // Vai precisar resolver vanity URL na API

  // Steam64 direto
  if (/^\d{17}$/.test(input)) return input;

  // Formato STEAM_0:X:XXXXXXXX
  if (/^STEAM_\d:\d:\d+$/.test(input)) return input;

  return null;
}

async function fetchSteamProfile(steamId) {
  try {
    // Chama nossa própria API (site) para buscar o perfil Steam
    const response = await fetch(`/api/steam/profile?steamId=${steamId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
