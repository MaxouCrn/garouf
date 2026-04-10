# Online Multiplayer — Plan 1: Supabase Foundations + Lobby

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Supabase infrastructure (DB schema, auth, Edge Functions) and build the lobby flow (create game, join game, lobby screen) so players can create and join a game room before gameplay begins.

**Architecture:** Supabase local dev for DB + Edge Functions. Client uses `@supabase/supabase-js` with Anonymous Auth. Lobby screens live in `app/online/`. The existing local mode is untouched — new online screens are additive.

**Tech Stack:** Supabase (Postgres, Realtime Broadcast, Edge Functions/Deno), Expo Router, React Native, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-10-online-multiplayer-design.md`

---

## File Structure

```
lib/
  supabase.ts                          — Supabase client init + anon auth helper

supabase/
  config.toml                          — Supabase local dev config
  migrations/
    20260410000000_create_tables.sql    — DB schema (games, players, actions) + RLS
  functions/
    _shared/
      cors.ts                          — CORS headers helper
      supabaseAdmin.ts                 — Service-role client for Edge Functions
    create-game/index.ts               — Create game + host player
    join-game/index.ts                 — Join game by code
    leave-game/index.ts                — Leave game / transfer host

app/
  index.tsx                            — Modified: add online mode buttons
  online/
    _layout.tsx                        — Stack layout for online screens
    create.tsx                         — Host: config roles, display code + QR
    join.tsx                           — Enter code + display name
    lobby.tsx                          — Real-time player list, host starts game

hooks/
  useChannel.ts                        — Realtime channel abstraction

types/
  online.ts                            — Shared TypeScript types for online mode
```

---

### Task 1: Install dependencies and init Supabase project

**Files:**
- Modify: `package.json`
- Create: `supabase/config.toml`
- Create: `.env.local`

- [ ] **Step 1: Install Supabase JS client and QR dependencies**

```bash
npx expo install @supabase/supabase-js react-native-qrcode-svg react-native-svg expo-camera
```

- [ ] **Step 2: Initialize Supabase local project**

```bash
npx supabase init
```

This creates `supabase/config.toml`. Edit it to enable Anonymous Auth:

```toml
[auth]
enabled = true
enable_anonymous_sign_ins = true
```

- [ ] **Step 3: Create `.env.local` with placeholder Supabase config**

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

Note: The actual anon key is printed when you run `npx supabase start`.

- [ ] **Step 4: Start Supabase locally and verify**

```bash
npx supabase start
```

Expected: Supabase services start, prints `API URL`, `anon key`, `service_role key`. Copy the anon key into `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json supabase/ .env.local
git commit -m "chore: install supabase deps and init local project"
```

---

### Task 2: Database migration — tables and RLS

**Files:**
- Create: `supabase/migrations/20260410000000_create_tables.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260410000000_create_tables.sql

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
-- Games: only service_role can insert/update/delete (Edge Functions)
-- (no policy = denied for anon/authenticated)

-- Players: can see all players in their game (public info)
CREATE POLICY "players_select_public" ON players FOR SELECT USING (
  game_id IN (SELECT game_id FROM players WHERE user_id = auth.uid())
);

-- Players: role column is hidden from other players via a security-definer view
-- For simplicity, we use column-level approach: clients query through Edge Functions
-- for role-sensitive data, and this policy allows basic reads.

-- Actions: no direct access (only via Edge Functions)
CREATE POLICY "actions_no_direct_access" ON actions FOR SELECT USING (false);
CREATE POLICY "actions_no_direct_insert" ON actions FOR INSERT WITH CHECK (false);
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db reset
```

Expected: Migration applies successfully, tables created.

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add database schema for online multiplayer (games, players, actions)"
```

---

### Task 3: Shared types for online mode

**Files:**
- Create: `types/online.ts`

- [ ] **Step 1: Create the shared types file**

```typescript
// types/online.ts

import type { Role } from "../game/roles";

// ── Database row types ──────────────────────────────────────────────────────

export interface GameRow {
  id: string;
  code: string;
  status: "lobby" | "playing" | "finished";
  host_id: string | null;
  phase: string | null;
  state_snapshot: Record<string, unknown> | null;
  settings: GameSettings;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  game_id: string;
  user_id: string;
  name: string;
  role: Role | null;
  is_alive: boolean;
  is_connected: boolean;
  joined_at: string;
}

export interface ActionRow {
  id: string;
  game_id: string;
  player_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  phase: string;
  turn: number;
  created_at: string;
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface GameSettings {
  selectedRoles: { role: Role; count: number }[];
  debateTimerMinutes: number;
}

// ── Lobby player (public info only) ─────────────────────────────────────────

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
}

// ── Realtime message payloads ───────────────────────────────────────────────

export interface LobbyUpdatePayload {
  players: LobbyPlayer[];
}

// ── Join code ───────────────────────────────────────────────────────────────

/** Characters used for game codes (excludes ambiguous: 0/O, 1/I/L) */
export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
```

- [ ] **Step 2: Commit**

```bash
git add types/online.ts
git commit -m "feat: add shared TypeScript types for online mode"
```

---

### Task 4: Supabase client library

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Write the Supabase client with anon auth**

```typescript
// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Ensure the user has an anonymous session.
 * Call this once at app startup. If a session already exists, it's reused.
 */
export async function ensureAnonymousSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Anonymous auth failed: ${error.message}`);
  return data.session!.user.id;
}
```

- [ ] **Step 2: Install AsyncStorage (required for Supabase auth persistence)**

```bash
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts package.json package-lock.json
git commit -m "feat: add Supabase client with anonymous auth"
```

---

### Task 5: Edge Function shared helpers

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/supabaseAdmin.ts`

- [ ] **Step 1: Create CORS helper**

```typescript
// supabase/functions/_shared/cors.ts

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

- [ ] **Step 2: Create admin Supabase client for Edge Functions**

```typescript
// supabase/functions/_shared/supabaseAdmin.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/_shared/
git commit -m "feat: add Edge Function shared helpers (CORS, admin client)"
```

---

### Task 6: Edge Function — `create-game`

**Files:**
- Create: `supabase/functions/create-game/index.ts`

- [ ] **Step 1: Write the create-game Edge Function**

```typescript
// supabase/functions/create-game/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the user from the JWT
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, settings } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    // Generate unique code
    let code: string;
    let codeExists = true;
    do {
      code = generateCode();
      const { data } = await admin
        .from("games")
        .select("id")
        .eq("code", code)
        .neq("status", "finished")
        .maybeSingle();
      codeExists = data !== null;
    } while (codeExists);

    // Create game
    const { data: game, error: gameError } = await admin
      .from("games")
      .insert({
        code,
        status: "lobby",
        phase: null,
        settings: settings ?? { selectedRoles: [], debateTimerMinutes: 3 },
      })
      .select("id, code")
      .single();

    if (gameError) throw gameError;

    // Create host player
    const { data: player, error: playerError } = await admin
      .from("players")
      .insert({
        game_id: game.id,
        user_id: user.id,
        name: name.trim(),
      })
      .select("id")
      .single();

    if (playerError) throw playerError;

    // Set host_id on game
    await admin
      .from("games")
      .update({ host_id: player.id })
      .eq("id", game.id);

    return new Response(
      JSON.stringify({
        gameId: game.id,
        code: game.code,
        playerId: player.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 2: Test locally**

```bash
npx supabase functions serve create-game --no-verify-jwt
```

Then in another terminal:

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/create-game \
  -H "Authorization: Bearer <your-anon-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Maxime", "settings": {"selectedRoles": [], "debateTimerMinutes": 3}}'
```

Expected: JSON response with `gameId`, `code`, `playerId`.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-game/
git commit -m "feat: add create-game Edge Function"
```

---

### Task 7: Edge Function — `join-game`

**Files:**
- Create: `supabase/functions/join-game/index.ts`

- [ ] **Step 1: Write the join-game Edge Function**

```typescript
// supabase/functions/join-game/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, name } = await req.json();
    if (!code || !name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Code and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    // Find the game
    const { data: game, error: gameError } = await admin
      .from("games")
      .select("id, status, host_id")
      .eq("code", code.toUpperCase().trim())
      .eq("status", "lobby")
      .maybeSingle();

    if (gameError) throw gameError;
    if (!game) {
      return new Response(JSON.stringify({ error: "Partie introuvable ou deja lancee" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already in this game
    const { data: existing } = await admin
      .from("players")
      .select("id")
      .eq("game_id", game.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ gameId: game.id, playerId: existing.id, alreadyJoined: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check player count (max 18)
    const { count } = await admin
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", game.id);

    if ((count ?? 0) >= 18) {
      return new Response(JSON.stringify({ error: "La partie est pleine (18 joueurs max)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert player
    const { data: player, error: playerError } = await admin
      .from("players")
      .insert({
        game_id: game.id,
        user_id: user.id,
        name: name.trim(),
      })
      .select("id")
      .single();

    if (playerError) throw playerError;

    // Get all players for broadcast
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name")
      .eq("game_id", game.id)
      .order("joined_at", { ascending: true });

    const lobbyPlayers = (allPlayers ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === game.host_id,
    }));

    // Broadcast lobby update via Realtime
    const channel = admin.channel(`game:${game.id}`);
    await channel.send({
      type: "broadcast",
      event: "lobby:update",
      payload: { players: lobbyPlayers },
    });

    return new Response(
      JSON.stringify({ gameId: game.id, playerId: player.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/join-game/
git commit -m "feat: add join-game Edge Function"
```

---

### Task 8: Edge Function — `leave-game`

**Files:**
- Create: `supabase/functions/leave-game/index.ts`

- [ ] **Step 1: Write the leave-game Edge Function**

```typescript
// supabase/functions/leave-game/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { gameId } = await req.json();
    const admin = getSupabaseAdmin();

    // Find the player
    const { data: player } = await admin
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!player) {
      return new Response(JSON.stringify({ error: "Player not in game" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this player is the host
    const { data: game } = await admin
      .from("games")
      .select("host_id")
      .eq("id", gameId)
      .single();

    const isHost = game?.host_id === player.id;

    // Remove the player
    await admin.from("players").delete().eq("id", player.id);

    if (isHost) {
      // Transfer host to oldest remaining player
      const { data: remaining } = await admin
        .from("players")
        .select("id")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (remaining) {
        await admin
          .from("games")
          .update({ host_id: remaining.id })
          .eq("id", gameId);
      } else {
        // No players left — mark game as finished
        await admin
          .from("games")
          .update({ status: "finished" })
          .eq("id", gameId);

        return new Response(
          JSON.stringify({ gameClosed: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get updated game + players for broadcast
    const { data: updatedGame } = await admin
      .from("games")
      .select("host_id")
      .eq("id", gameId)
      .single();

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });

    const lobbyPlayers = (allPlayers ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === updatedGame?.host_id,
    }));

    const channel = admin.channel(`game:${gameId}`);
    await channel.send({
      type: "broadcast",
      event: "lobby:update",
      payload: { players: lobbyPlayers },
    });

    return new Response(
      JSON.stringify({ left: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/leave-game/
git commit -m "feat: add leave-game Edge Function with host transfer"
```

---

### Task 9: Realtime channel hook — `useChannel`

**Files:**
- Create: `hooks/useChannel.ts`

- [ ] **Step 1: Write the channel abstraction hook**

```typescript
// hooks/useChannel.ts

import { useEffect, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type MessageHandler = (payload: Record<string, unknown>) => void;

interface UseChannelOptions {
  channelName: string;
  onMessage: Record<string, MessageHandler>;
  enabled?: boolean;
}

export function useChannel({ channelName, onMessage, enabled = true }: UseChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef(onMessage);
  handlersRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const channel = supabase.channel(channelName);

    // Subscribe to broadcast events
    channel.on("broadcast", { event: "*" }, (msg) => {
      const handler = handlersRef.current[msg.event];
      if (handler) {
        handler(msg.payload as Record<string, unknown>);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [channelName, enabled]);

  const send = useCallback(async (event: string, payload: Record<string, unknown>) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event,
      payload,
    });
  }, []);

  return { send };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useChannel.ts
git commit -m "feat: add useChannel hook for Realtime broadcast"
```

---

### Task 10: Online layout and navigation

**Files:**
- Create: `app/online/_layout.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create the online stack layout**

```typescript
// app/online/_layout.tsx

import { Stack } from "expo-router";
import { colors } from "../../theme/colors";

export default function OnlineLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="create" options={{ title: "Creer une partie" }} />
      <Stack.Screen name="join" options={{ title: "Rejoindre" }} />
      <Stack.Screen name="lobby" options={{ title: "Salon", headerBackVisible: false }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Register the online route group in root layout**

Add to `app/_layout.tsx` inside the `<Stack>`:

```tsx
<Stack.Screen name="online" options={{ headerShown: false }} />
```

Add it after the existing `<Stack.Screen name="index" .../>` line.

- [ ] **Step 3: Commit**

```bash
git add app/online/_layout.tsx app/_layout.tsx
git commit -m "feat: add online navigation layout"
```

---

### Task 11: Home screen — add online mode buttons

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add "Creer une partie en ligne" and "Rejoindre une partie" buttons**

Add two new `Pressable` buttons after the existing "Grimoire des Rôles" button:

```tsx
<Pressable
  style={[styles.outlineButton, { marginTop: 32 }]}
  onPress={() => router.push("/online/create")}
>
  <Text style={styles.outlineButtonText}>Creer une partie en ligne</Text>
</Pressable>
<Pressable
  style={styles.outlineButton}
  onPress={() => router.push("/online/join")}
>
  <Text style={styles.outlineButtonText}>Rejoindre une partie</Text>
</Pressable>
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add online mode buttons to home screen"
```

---

### Task 12: Create game screen

**Files:**
- Create: `app/online/create.tsx`

- [ ] **Step 1: Write the create screen**

```tsx
// app/online/create.tsx

import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase, ensureAnonymousSession } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function CreateGameScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (name.trim().length === 0) return;
    setLoading(true);
    setError(null);

    try {
      await ensureAnonymousSession();

      const { data, error: fnError } = await supabase.functions.invoke("create-game", {
        body: {
          name: name.trim(),
          settings: { selectedRoles: [], debateTimerMinutes: 3 },
        },
      });

      if (fnError) throw fnError;

      router.replace({
        pathname: "/online/lobby",
        params: {
          gameId: data.gameId,
          code: data.code,
          playerId: data.playerId,
          isHost: "true",
        },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creer une partie</Text>
      <Text style={styles.label}>Ton pseudo</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Entre ton pseudo..."
        placeholderTextColor={colors.textMuted}
        maxLength={20}
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, (!name.trim() || loading) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.buttonText}>Creer le salon</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  error: {
    color: colors.danger,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/online/create.tsx
git commit -m "feat: add create game screen with Supabase integration"
```

---

### Task 13: Join game screen

**Files:**
- Create: `app/online/join.tsx`

- [ ] **Step 1: Write the join screen**

```tsx
// app/online/join.tsx

import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase, ensureAnonymousSession } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { CODE_LENGTH } from "../../types/online";

export default function JoinGameScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (code.trim().length !== CODE_LENGTH || name.trim().length === 0) return;
    setLoading(true);
    setError(null);

    try {
      await ensureAnonymousSession();

      const { data, error: fnError } = await supabase.functions.invoke("join-game", {
        body: { code: code.trim().toUpperCase(), name: name.trim() },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      router.replace({
        pathname: "/online/lobby",
        params: {
          gameId: data.gameId,
          playerId: data.playerId,
          isHost: "false",
        },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const canJoin = code.trim().length === CODE_LENGTH && name.trim().length > 0 && !loading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejoindre une partie</Text>

      <Text style={styles.label}>Code de la partie</Text>
      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="LOUP42"
        placeholderTextColor={colors.textMuted}
        maxLength={CODE_LENGTH}
        autoCapitalize="characters"
        autoFocus
      />

      <Text style={styles.label}>Ton pseudo</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Entre ton pseudo..."
        placeholderTextColor={colors.textMuted}
        maxLength={20}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, !canJoin && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={!canJoin}
      >
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.buttonText}>Rejoindre</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  codeInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  error: {
    color: colors.danger,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/online/join.tsx
git commit -m "feat: add join game screen with code input"
```

---

### Task 14: Lobby screen with real-time player list and QR code

**Files:**
- Create: `app/online/lobby.tsx`

- [ ] **Step 1: Write the lobby screen**

```tsx
// app/online/lobby.tsx

import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../../lib/supabase";
import { useChannel } from "../../hooks/useChannel";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { LobbyPlayer, LobbyUpdatePayload } from "../../types/online";

export default function LobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    gameId: string;
    code: string;
    playerId: string;
    isHost: string;
  }>();

  const isHost = params.isHost === "true";
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);

  const onMessage = {
    "lobby:update": useCallback((payload: Record<string, unknown>) => {
      const data = payload as unknown as LobbyUpdatePayload;
      setPlayers(data.players);
    }, []),
  };

  useChannel({
    channelName: `game:${params.gameId}`,
    onMessage,
  });

  const handleLeave = async () => {
    await supabase.functions.invoke("leave-game", {
      body: { gameId: params.gameId },
    });
    router.replace("/");
  };

  const handleStart = () => {
    if (players.length < 6) {
      Alert.alert("Pas assez de joueurs", "Il faut au moins 6 joueurs pour commencer.");
      return;
    }
    // TODO: Plan 2 will implement start-game Edge Function
    Alert.alert("Bientot", "Le lancement de la partie arrive dans la prochaine mise a jour !");
  };

  const deepLink = `loupgarou://join?code=${params.code}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Salon</Text>

      {/* Code + QR */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Code de la partie</Text>
        <Text style={styles.code}>{params.code}</Text>
        <View style={styles.qrContainer}>
          <QRCode value={deepLink} size={160} backgroundColor="transparent" color={colors.text} />
        </View>
      </View>

      {/* Player list */}
      <Text style={styles.playersTitle}>
        Joueurs ({players.length})
      </Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>
              {item.name} {item.isHost ? "👑" : ""}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>En attente de joueurs...</Text>
        }
      />

      {/* Actions */}
      <View style={styles.actions}>
        {isHost && (
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Lancer la partie</Text>
          </Pressable>
        )}
        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Quitter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  codeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  code: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 8,
    marginBottom: 16,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  playersTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "bold",
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    color: colors.text,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
  actions: {
    paddingVertical: 16,
    gap: 12,
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  leaveButtonText: {
    color: colors.danger,
    fontSize: 16,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/online/lobby.tsx
git commit -m "feat: add lobby screen with real-time player list and QR code"
```

---

### Task 15: Verify existing tests still pass

- [ ] **Step 1: Run all existing tests**

```bash
npx jest
```

Expected: All existing tests pass. The online mode is purely additive — no existing files modified except `index.tsx` (buttons only) and `_layout.tsx` (route registration).

- [ ] **Step 2: Run type checker**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Start the app and verify**

```bash
npx expo start --clear
```

Verify:
1. Home screen shows the new "Creer une partie en ligne" and "Rejoindre une partie" buttons
2. Tapping "Nouvelle partie" still works as before (local mode untouched)
3. Tapping "Creer une partie en ligne" navigates to the create screen
4. Tapping "Rejoindre une partie" navigates to the join screen

- [ ] **Step 4: Final commit for Plan 1**

```bash
git add -A
git commit -m "feat: complete online lobby foundation (Plan 1)"
```
