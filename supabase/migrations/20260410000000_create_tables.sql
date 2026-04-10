-- ── Games table ─────────────────────────────────────────────────────────────
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'finished')),
  host_id uuid,
  phase text,
  state_snapshot jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ── Players table ───────────────────────────────────────────────────────────
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  role text,
  is_alive boolean NOT NULL DEFAULT true,
  is_connected boolean NOT NULL DEFAULT true,
  joined_at timestamptz DEFAULT now()
);

-- Add FK from games.host_id to players.id (deferred to avoid circular dep)
ALTER TABLE games ADD CONSTRAINT fk_games_host FOREIGN KEY (host_id) REFERENCES players(id);

CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_games_code ON games(code) WHERE status != 'finished';

-- ── Actions table ───────────────────────────────────────────────────────────
CREATE TABLE actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  action_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  phase text NOT NULL,
  turn integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_actions_game_id ON actions(game_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Games: anyone can read by code (for joining)
CREATE POLICY "games_select" ON games FOR SELECT USING (true);

-- Players: can see all players in their game (public info)
CREATE POLICY "players_select_public" ON players FOR SELECT USING (
  game_id IN (SELECT game_id FROM players WHERE user_id = auth.uid())
);

-- Actions: no direct access (only via Edge Functions with service_role)
CREATE POLICY "actions_no_direct_access" ON actions FOR SELECT USING (false);
CREATE POLICY "actions_no_direct_insert" ON actions FOR INSERT WITH CHECK (false);
