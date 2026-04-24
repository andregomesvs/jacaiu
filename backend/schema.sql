-- ============================================
-- JÁ CAIU? — Schema do Banco de Dados
-- Execute isso no Supabase > SQL Editor
-- ============================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: perfis de usuário
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  steam_id TEXT UNIQUE,              -- Steam64 ID do usuário (login via Steam)
  steam_display_name TEXT,           -- Nome de exibição do Steam
  email_alerts BOOLEAN DEFAULT true,
  push_alerts BOOLEAN DEFAULT true,
  onesignal_player_id TEXT, -- ID do dispositivo para push
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por steam_id
CREATE INDEX idx_profiles_steam_id ON profiles(steam_id);

-- Criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, steam_id, email_alerts, push_alerts)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'steam_id',
    true,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TABELA: jogadores monitorados
-- ============================================
CREATE TABLE players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  steam_id TEXT NOT NULL,          -- Ex: STEAM_0:1:12345678
  steam_profile_url TEXT,          -- URL do perfil Steam
  display_name TEXT NOT NULL,      -- Nome exibido
  avatar_url TEXT,                 -- Avatar do Steam
  faceit_id TEXT,                  -- ID no FACEIT (se encontrado)
  gamerclub_id TEXT,               -- ID no Gamer Club (se encontrado)
  is_banned BOOLEAN DEFAULT false, -- Status geral de ban
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, steam_id)        -- Mesmo jogador não pode ser adicionado duas vezes
);

-- ============================================
-- TABELA: bans detectados
-- ============================================
CREATE TABLE bans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('steam', 'faceit', 'gamerclub')),
  ban_type TEXT NOT NULL,          -- Ex: "VAC Ban", "Cheat", "Smurf"
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_date TEXT,                   -- Data do ban na plataforma (pode ser string)
  details JSONB,                   -- Dados extras da API
  UNIQUE(player_id, platform)      -- Um ban por plataforma por jogador
);

-- ============================================
-- TABELA: notificações enviadas (histórico)
-- ============================================
CREATE TABLE notifications_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  ban_id UUID REFERENCES bans(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true
);

-- ============================================
-- SEGURANÇA: Row Level Security (RLS)
-- Cada usuário só vê seus próprios dados
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuário vê só seu perfil" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Policies para players
CREATE POLICY "Usuário vê só seus jogadores" ON players
  FOR ALL USING (auth.uid() = user_id);

-- Policies para bans (leitura via join com players)
CREATE POLICY "Usuário vê bans dos seus jogadores" ON bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = bans.player_id
      AND players.user_id = auth.uid()
    )
  );

-- Service role pode fazer tudo (para o cron job)
CREATE POLICY "Service role tem acesso total a players" ON players
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role tem acesso total a bans" ON bans
  FOR ALL TO service_role USING (true);

-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_steam_id ON players(steam_id);
CREATE INDEX idx_bans_player_id ON bans(player_id);
CREATE INDEX idx_bans_platform ON bans(platform);
CREATE INDEX idx_players_last_checked ON players(last_checked_at);
