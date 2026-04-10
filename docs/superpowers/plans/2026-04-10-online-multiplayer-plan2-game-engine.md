# Online Multiplayer — Plan 2: Game Engine + Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the server-side game engine (Edge Functions for start-game, night actions, voting, hunter) and the client-side online game screen so that a full game can be played online end-to-end.

**Architecture:** Edge Functions orchestrate the game server-side, reusing existing pure game logic (`resolveNight`, `resolveVote`, `buildNightSteps`, `assignRoles`, `generateLittleGirlClue`). Client uses `useOnlineGame` hook to receive Realtime broadcasts and render the appropriate view. Host plays audio.

**Tech Stack:** Supabase Edge Functions (Deno), Supabase Realtime Broadcast, React Native, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-10-online-multiplayer-design.md`

**Depends on:** Plan 1 (completed) — Supabase setup, DB schema, lobby screens, useChannel hook

---

## File Structure

```
types/
  online.ts                              — Extend with game phase message types

supabase/
  functions/
    start-game/index.ts                  — Assign roles, distribute, start night
    night-action/index.ts                — Handle night actions, advance steps, resolve
    cast-vote/index.ts                   — Day voting, resolve elimination
    hunter-shoot/index.ts                — Hunter death trigger
    sync-clock/index.ts                  — Broadcast debate timer start
    reconnect/index.ts                   — Return current state for reconnecting client

hooks/
  useOnlineGame.ts                       — Main online state hook

app/
  online/
    lobby.tsx                            — Modify: wire up start-game
    game.tsx                             — Main online game screen with sub-views

components/
  online/
    DistributionView.tsx                 — Role reveal
    NightWaitView.tsx                    — Waiting screen during night
    NightActionView.tsx                  — Role action screen (seer, savior, witch, cupid, raven)
    WolfVoteView.tsx                     — Werewolf collective vote
    LittleGirlView.tsx                   — Little girl clue display
    DayAnnouncementView.tsx              — Night results
    DayDebateView.tsx                    — Debate timer
    DayVoteView.tsx                      — Simultaneous vote
    HunterView.tsx                       — Hunter shoot
    SpectatorView.tsx                    — Dead player view
    EndView.tsx                          — Game over
    ActionTimer.tsx                      — Countdown timer component (15s/30s)
```

---

### Task 1: Extend online types with game message payloads

**Files:**
- Modify: `types/online.ts`

- [ ] **Step 1: Add game phase message types to `types/online.ts`**

Add the following types after the existing `LobbyUpdatePayload`:

```typescript
import type { NightStep } from "../game/nightEngine";

// ── Game phase payloads (public) ────────────────────────────────────────────

export interface GamePhasePayload {
  phase: string;
  turn: number;
  nightStep?: NightStep;
}

export interface GameStatePayload {
  alivePlayers: { id: string; name: string }[];
  nightDeaths: { id: string; name: string }[];
  voteResult?: { eliminatedId: string; eliminatedName: string; votes: Record<string, string> } | null;
  winner?: "werewolves" | "villagers" | "lovers" | null;
}

export interface NightStepPayload {
  step: NightStep;
}

export interface VoteStatusPayload {
  votedCount: number;
  totalVoters: number;
}

export interface VoteResultPayload {
  eliminated: { id: string; name: string } | null;
  voteDetails: Record<string, string>; // voterId -> targetId
  villageIdiotSurvived: boolean;
}

export interface TimerStartPayload {
  startedAt: number;
  durationMs: number;
}

export interface GamePausedPayload {
  reason: string;
  disconnectedPlayer: string;
  resumeIn: number;
}

// ── Private message payloads ────────────────────────────────────────────────

export interface RoleAssignPayload {
  role: string;
  description: string;
}

export interface NightActionRequiredPayload {
  step: NightStep;
  targets: { id: string; name: string }[];
  instruction: string;
  timerSeconds: number;
  /** For witch: who was attacked tonight */
  werewolfTarget?: { id: string; name: string } | null;
  /** For witch: available potions */
  potions?: { life: boolean; death: boolean };
}

export interface NightActionResultPayload {
  result: Record<string, unknown>;
}

export interface LoversRevealPayload {
  partnerName: string;
  isMixed: boolean;
}

export interface WolfVoteUpdatePayload {
  votes: Record<string, number>; // targetId -> vote count
}

export interface LittleGirlCluePayload {
  clueNames: string[];
}

// ── Online game client state ────────────────────────────────────────────────

export interface OnlineGameState {
  gameId: string;
  playerId: string;
  isHost: boolean;
  phase: "distribution" | "night" | "day" | "hunter" | "end" | "paused";
  turn: number;
  nightStep: NightStep | null;
  myRole: string | null;
  myRoleDescription: string | null;
  isAlive: boolean;
  alivePlayers: { id: string; name: string }[];
  nightDeaths: { id: string; name: string }[];
  winner: "werewolves" | "villagers" | "lovers" | null;

  // Night-specific
  actionRequired: NightActionRequiredPayload | null;
  actionResult: NightActionResultPayload | null;
  wolfVotes: Record<string, number>;
  littleGirlClue: string[];
  loversReveal: LoversRevealPayload | null;

  // Day-specific
  voteStatus: VoteStatusPayload | null;
  voteResult: VoteResultPayload | null;
  debateTimer: TimerStartPayload | null;

  // Pause
  pauseInfo: GamePausedPayload | null;
}
```

Also update the import at the top to include `NightStep`:

```typescript
import type { Role } from "../game/roles";
import type { NightStep } from "../game/nightEngine";
```

- [ ] **Step 2: Commit**

```bash
git add types/online.ts
git commit -m "feat: extend online types with game phase and action payloads"
```

---

### Task 2: Edge Function — `start-game`

**Files:**
- Create: `supabase/functions/start-game/index.ts`

- [ ] **Step 1: Write the start-game Edge Function**

This function:
1. Validates the caller is the host
2. Validates enough players (6-18) and valid role selection
3. Assigns roles using a Fisher-Yates shuffle (replicates `assignRoles` logic since we can't import React Native modules in Deno)
4. Updates each player's `role` in DB
5. Sends private `role:assign` message to each player
6. Transitions game to `playing` status, `distribution` phase
7. Broadcasts `game:phase` to all

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  werewolf: "Chaque nuit, les Loups-Garous designent une victime.",
  villager: "Pas de pouvoir special, mais ta voix compte au vote.",
  seer: "Chaque nuit, decouvre la veritable identite d'un joueur.",
  witch: "Tu as une potion de vie et une potion de mort.",
  hunter: "Quand tu meurs, tu tires sur le joueur de ton choix.",
  cupid: "La premiere nuit, designe deux amoureux.",
  little_girl: "Certaines nuits, tu apercois des silhouettes suspectes.",
  savior: "Chaque nuit, protege un joueur des loups.",
  elder: "Tu resistes a une attaque des loups (2 vies).",
  raven: "Chaque nuit, designe un joueur qui recevra 2 votes bonus.",
  village_idiot: "Tu survis a ton premier vote d'elimination.",
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

    const { gameId, settings } = await req.json();
    const admin = getSupabaseAdmin();

    // Verify game exists and caller is host
    const { data: game } = await admin
      .from("games")
      .select("id, host_id, status")
      .eq("id", gameId)
      .single();

    if (!game || game.status !== "lobby") {
      return new Response(JSON.stringify({ error: "Game not in lobby" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify host
    const { data: hostPlayer } = await admin
      .from("players")
      .select("id, user_id")
      .eq("id", game.host_id)
      .single();

    if (!hostPlayer || hostPlayer.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only host can start" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get players
    const { data: players } = await admin
      .from("players")
      .select("id, name, user_id")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });

    if (!players || players.length < 6 || players.length > 18) {
      return new Response(JSON.stringify({ error: "Need 6-18 players" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build role list from settings
    const selectedRoles: { role: string; count: number }[] = settings?.selectedRoles ?? [];
    const roleList: string[] = [];
    for (const { role, count } of selectedRoles) {
      for (let i = 0; i < count; i++) {
        roleList.push(role);
      }
    }

    if (roleList.length !== players.length) {
      return new Response(
        JSON.stringify({ error: `Role count (${roleList.length}) != player count (${players.length})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Shuffle and assign
    const shuffledRoles = shuffleArray(roleList);
    const channel = admin.channel(`game:${gameId}`);

    for (let i = 0; i < players.length; i++) {
      const role = shuffledRoles[i];
      await admin
        .from("players")
        .update({ role })
        .eq("id", players[i].id);

      // Send private role assignment
      await channel.send({
        type: "broadcast",
        event: `private:${players[i].id}:role:assign`,
        payload: {
          role,
          description: ROLE_DESCRIPTIONS[role] ?? "",
        },
      });
    }

    // Update game status
    await admin
      .from("games")
      .update({
        status: "playing",
        phase: "distribution",
        settings: settings ?? { selectedRoles: [], debateTimerMinutes: 3 },
      })
      .eq("id", gameId);

    // Broadcast phase change
    await channel.send({
      type: "broadcast",
      event: "game:phase",
      payload: { phase: "distribution", turn: 0 },
    });

    return new Response(
      JSON.stringify({ started: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
git add supabase/functions/start-game/
git commit -m "feat: add start-game Edge Function with role assignment"
```

---

### Task 3: Edge Function — `night-action`

**Files:**
- Create: `supabase/functions/night-action/index.ts`

- [ ] **Step 1: Write the night-action Edge Function**

This is the most complex function. It handles all night actions, step progression, and night resolution.

The function:
1. Validates the action (correct phase, correct step, player has the role, target is valid)
2. Stores the action in the `actions` table
3. For werewolves: broadcasts vote update to other wolves, waits for all wolves
4. When all actions for a step are received → advances to next step
5. Sends `night:action_required` to the next active role
6. When last step completes → resolves night using the same logic as `resolveNight()`
7. Snapshots state to DB

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Night step order (must match client)
const STEP_ROLE_MAP: Record<string, string | string[]> = {
  cupid: "cupid",
  seer: "seer",
  savior: "savior",
  werewolves: "werewolf",
  witch: "witch",
  raven: "raven",
  little_girl: "little_girl",
};

const STEP_TIMER: Record<string, number> = {
  cupid: 15,
  seer: 15,
  savior: 15,
  werewolves: 30,
  witch: 15,
  raven: 15,
  little_girl: 15,
};

const STEP_INSTRUCTION: Record<string, string> = {
  cupid: "Designe deux joueurs qui seront lies par l'amour.",
  seer: "Choisis un joueur pour decouvrir son role.",
  savior: "Choisis un joueur a proteger cette nuit.",
  werewolves: "Choisissez ensemble une victime.",
  witch: "Utilise tes potions ou passe ton tour.",
  raven: "Designe un joueur qui recevra 2 votes bonus demain.",
  little_girl: "Observe les silhouettes dans la nuit...",
};

function isAliveWithRole(players: any[], role: string): boolean {
  return players.some((p: any) => p.role === role && p.is_alive);
}

function buildNightSteps(players: any[], isFirstNight: boolean, currentTurn: number, elderKilledByVillage: boolean): string[] {
  const steps: string[] = ["intro"];

  if (elderKilledByVillage) {
    steps.push("werewolves", "resolution");
    return steps;
  }

  if (isFirstNight && isAliveWithRole(players, "cupid")) {
    steps.push("cupid", "lovers_reveal");
  }

  if (isAliveWithRole(players, "seer")) steps.push("seer");
  if (isAliveWithRole(players, "savior")) steps.push("savior");

  steps.push("werewolves");

  if (isAliveWithRole(players, "witch")) steps.push("witch");
  if (isAliveWithRole(players, "raven")) steps.push("raven");
  if (isAliveWithRole(players, "little_girl") && currentTurn % 2 !== 0)
    steps.push("little_girl");

  steps.push("resolution");
  return steps;
}

function generateLittleGirlClue(players: any[]): string[] {
  const aliveWolves = players.filter((p: any) => p.is_alive && p.role === "werewolf");
  const aliveNonWolves = players.filter(
    (p: any) => p.is_alive && p.role !== "werewolf" && p.role !== "little_girl"
  );

  if (aliveWolves.length === 0) return [];

  const wolf = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];
  const shuffledNonWolves = [...aliveNonWolves].sort(() => Math.random() - 0.5);
  const nonWolfCount = Math.min(1 + Math.floor(Math.random() * 2), shuffledNonWolves.length);
  const selectedNonWolves = shuffledNonWolves.slice(0, nonWolfCount);

  const clues = [wolf.id, ...selectedNonWolves.map((p: any) => p.id)];
  return clues.sort(() => Math.random() - 0.5);
}

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

    const { gameId, actionType, payload } = await req.json();
    const admin = getSupabaseAdmin();

    // Get game state
    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "night") {
      return new Response(JSON.stringify({ error: "Game not in night phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = game.state_snapshot || {};
    const currentStep = snapshot.currentNightStep;
    const nightSteps = snapshot.nightSteps || [];
    const nightStepIndex = snapshot.nightStepIndex || 0;

    // Get player
    const { data: player } = await admin
      .from("players")
      .select("id, role, is_alive, user_id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player || !player.is_alive) {
      return new Response(JSON.stringify({ error: "Player not alive" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the action
    await admin.from("actions").insert({
      game_id: gameId,
      player_id: player.id,
      action_type: actionType,
      payload: payload || {},
      phase: "night",
      turn: snapshot.turn || 1,
    });

    const channel = admin.channel(`game:${gameId}`);
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, role, is_alive")
      .eq("game_id", gameId);

    // Handle wolf vote broadcast
    if (actionType === "werewolf_target" && currentStep === "werewolves") {
      const { data: wolfActions } = await admin
        .from("actions")
        .select("payload")
        .eq("game_id", gameId)
        .eq("action_type", "werewolf_target")
        .eq("phase", "night")
        .eq("turn", snapshot.turn || 1);

      const voteCounts: Record<string, number> = {};
      for (const a of wolfActions || []) {
        const targetId = (a.payload as any)?.targetId;
        if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }

      // Broadcast to wolves only
      const wolves = (allPlayers || []).filter((p: any) => p.role === "werewolf" && p.is_alive);
      for (const wolf of wolves) {
        await channel.send({
          type: "broadcast",
          event: `private:${wolf.id}:wolf:vote_update`,
          payload: { votes: voteCounts },
        });
      }

      // Check if all wolves have voted
      if ((wolfActions || []).length < wolves.length) {
        return new Response(
          JSON.stringify({ received: true, waitingForOthers: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Resolve wolf vote: majority, tie = random
      let maxVotes = 0;
      let candidates: string[] = [];
      for (const [targetId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          candidates = [targetId];
        } else if (count === maxVotes) {
          candidates.push(targetId);
        }
      }
      const finalTarget = candidates[Math.floor(Math.random() * candidates.length)];
      snapshot.nightActions = snapshot.nightActions || {};
      snapshot.nightActions.werewolvesTarget = finalTarget;
    }

    // Handle seer action
    if (actionType === "seer_inspect" && currentStep === "seer") {
      const targetId = payload?.targetId;
      const target = (allPlayers || []).find((p: any) => p.id === targetId);
      snapshot.nightActions = snapshot.nightActions || {};
      snapshot.nightActions.seerTarget = targetId;

      // Send role to seer privately
      await channel.send({
        type: "broadcast",
        event: `private:${player.id}:night:action_result`,
        payload: { result: { role: target?.role || "unknown", name: target?.name } },
      });
    }

    // Handle savior action
    if (actionType === "savior_protect" && currentStep === "savior") {
      snapshot.saviorTarget = payload?.targetId || null;
    }

    // Handle witch actions
    if (actionType === "witch_action" && currentStep === "witch") {
      snapshot.nightActions = snapshot.nightActions || {};
      if (payload?.heal) {
        snapshot.nightActions.witchHeal = true;
      }
      if (payload?.killTargetId) {
        snapshot.nightActions.witchKill = payload.killTargetId;
      }
    }

    // Handle cupid action
    if (actionType === "cupid_choose" && currentStep === "cupid") {
      const lover1 = payload?.lover1;
      const lover2 = payload?.lover2;
      snapshot.lovers = [lover1, lover2];

      // Will reveal to lovers in lovers_reveal step
    }

    // Handle raven action
    if (actionType === "raven_mark" && currentStep === "raven") {
      snapshot.ravenTarget = payload?.targetId || null;
    }

    // Advance to next step
    const nextStepIndex = nightStepIndex + 1;
    if (nextStepIndex >= nightSteps.length) {
      // Should not happen — resolution handles this
      return new Response(
        JSON.stringify({ error: "Night steps exhausted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nextStep = nightSteps[nextStepIndex];
    snapshot.nightStepIndex = nextStepIndex;
    snapshot.currentNightStep = nextStep;

    // Handle automatic steps
    if (nextStep === "lovers_reveal" && snapshot.lovers) {
      const [l1Id, l2Id] = snapshot.lovers;
      const l1 = (allPlayers || []).find((p: any) => p.id === l1Id);
      const l2 = (allPlayers || []).find((p: any) => p.id === l2Id);
      const isMixed = l1 && l2 &&
        ((l1.role === "werewolf") !== (l2.role === "werewolf"));

      await channel.send({
        type: "broadcast",
        event: `private:${l1Id}:lovers:reveal`,
        payload: { partnerName: l2?.name, isMixed },
      });
      await channel.send({
        type: "broadcast",
        event: `private:${l2Id}:lovers:reveal`,
        payload: { partnerName: l1?.name, isMixed },
      });

      // Auto-advance past lovers_reveal
      const afterLoversIndex = nextStepIndex + 1;
      if (afterLoversIndex < nightSteps.length) {
        snapshot.nightStepIndex = afterLoversIndex;
        snapshot.currentNightStep = nightSteps[afterLoversIndex];
      }
    }

    // Handle little_girl step (auto-generate clue)
    if (snapshot.currentNightStep === "little_girl") {
      const clueIds = generateLittleGirlClue(allPlayers || []);
      const clueNames = clueIds.map((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return p?.name || "???";
      });
      const littleGirl = (allPlayers || []).find((p: any) => p.role === "little_girl" && p.is_alive);
      if (littleGirl) {
        await channel.send({
          type: "broadcast",
          event: `private:${littleGirl.id}:little_girl:clue`,
          payload: { clueNames },
        });
      }
    }

    // Handle resolution step
    if (snapshot.currentNightStep === "resolution") {
      const nightActions = snapshot.nightActions || {};
      const deaths: string[] = [];
      let savedByWitch = false;
      let savedBySavior = false;
      let elderLostLife = false;
      let newElderLives = snapshot.elderLives ?? 2;
      const updatedPotions = { ...(snapshot.witchPotions || { life: true, death: true }) };

      const target = nightActions.werewolvesTarget;

      if (target) {
        let targetSaved = false;

        if (snapshot.saviorTarget === target) {
          targetSaved = true;
          savedBySavior = true;
        }

        if (!targetSaved) {
          const targetPlayer = (allPlayers || []).find((p: any) => p.id === target);
          if (targetPlayer?.role === "elder" && newElderLives > 1) {
            targetSaved = true;
            elderLostLife = true;
            newElderLives -= 1;
          }
        }

        if (!targetSaved && nightActions.witchHeal && updatedPotions.life) {
          targetSaved = true;
          savedByWitch = true;
          updatedPotions.life = false;
        }

        if (!targetSaved) {
          deaths.push(target);
        }
      }

      if (nightActions.witchKill && updatedPotions.death) {
        if (!deaths.includes(nightActions.witchKill)) {
          deaths.push(nightActions.witchKill);
        }
        updatedPotions.death = false;
      }

      // Lovers cascade
      let loversCascade: string | null = null;
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        for (const deadId of [...deaths]) {
          if (l1 === deadId && !deaths.includes(l2)) {
            loversCascade = l2;
            deaths.push(l2);
            break;
          } else if (l2 === deadId && !deaths.includes(l1)) {
            loversCascade = l1;
            deaths.push(l1);
            break;
          }
        }
      }

      // Apply deaths
      for (const deadId of deaths) {
        await admin
          .from("players")
          .update({ is_alive: false })
          .eq("id", deadId);
      }

      // Check hunter trigger
      const hunterTriggered = deaths.some((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return p?.role === "hunter";
      });

      // Check winner
      const updatedPlayers = (allPlayers || []).map((p: any) => ({
        ...p,
        is_alive: deaths.includes(p.id) ? false : p.is_alive,
      }));
      const aliveWolves = updatedPlayers.filter((p: any) => p.is_alive && p.role === "werewolf");
      const aliveVillagers = updatedPlayers.filter((p: any) => p.is_alive && p.role !== "werewolf");
      const aliveAll = updatedPlayers.filter((p: any) => p.is_alive);

      let winner: string | null = null;
      if (aliveWolves.length === 0) winner = "villagers";
      else if (aliveVillagers.length === 0) winner = "werewolves";

      if (!winner && snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        const l1Player = updatedPlayers.find((p: any) => p.id === l1);
        const l2Player = updatedPlayers.find((p: any) => p.id === l2);
        if (l1Player && l2Player) {
          const isMixed = (l1Player.role === "werewolf") !== (l2Player.role === "werewolf");
          if (isMixed && l1Player.is_alive && l2Player.is_alive && aliveAll.length === 2) {
            winner = "lovers";
          }
        }
      }

      // Update snapshot
      snapshot.elderLives = newElderLives;
      snapshot.witchPotions = updatedPotions;
      snapshot.lastSaviorTarget = snapshot.saviorTarget;
      snapshot.nightDeaths = deaths;

      const deathDetails = deaths.map((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return { id, name: p?.name || "?" };
      });

      const aliveDetails = updatedPlayers
        .filter((p: any) => p.is_alive)
        .map((p: any) => ({ id: p.id, name: p.name }));

      // Determine next phase
      let nextPhase = "day";
      if (winner) nextPhase = "end";
      else if (hunterTriggered) nextPhase = "hunter";

      snapshot.nightActions = { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null };
      snapshot.saviorTarget = null;
      snapshot.ravenTarget = snapshot.ravenTarget; // Persist for day vote

      await admin
        .from("games")
        .update({
          phase: nextPhase,
          state_snapshot: snapshot,
          ...(winner ? { status: "finished" } : {}),
        })
        .eq("id", gameId);

      // Broadcast results
      await channel.send({
        type: "broadcast",
        event: "game:state",
        payload: {
          alivePlayers: aliveDetails,
          nightDeaths: deathDetails,
          winner,
        },
      });

      await channel.send({
        type: "broadcast",
        event: "game:phase",
        payload: { phase: nextPhase, turn: snapshot.turn || 1 },
      });

      return new Response(
        JSON.stringify({ resolved: true, deaths: deathDetails, winner }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Not resolution — send next step info
    // Broadcast step change to all
    await channel.send({
      type: "broadcast",
      event: "night:step",
      payload: { step: snapshot.currentNightStep },
    });

    // Send action_required to the active role player(s)
    const stepRole = STEP_ROLE_MAP[snapshot.currentNightStep];
    if (stepRole) {
      const activePlayers = (allPlayers || []).filter((p: any) =>
        p.is_alive && (Array.isArray(stepRole) ? stepRole.includes(p.role) : p.role === stepRole)
      );
      const targets = (allPlayers || [])
        .filter((p: any) => p.is_alive && p.id !== player.id)
        .map((p: any) => ({ id: p.id, name: p.name }));

      for (const activePlayer of activePlayers) {
        const actionPayload: any = {
          step: snapshot.currentNightStep,
          targets,
          instruction: STEP_INSTRUCTION[snapshot.currentNightStep] || "",
          timerSeconds: STEP_TIMER[snapshot.currentNightStep] || 15,
        };

        // Witch gets extra info
        if (snapshot.currentNightStep === "witch") {
          const wtarget = snapshot.nightActions?.werewolvesTarget;
          const wtargetPlayer = wtarget ? (allPlayers || []).find((p: any) => p.id === wtarget) : null;
          actionPayload.werewolfTarget = wtargetPlayer ? { id: wtargetPlayer.id, name: wtargetPlayer.name } : null;
          actionPayload.potions = snapshot.witchPotions || { life: true, death: true };
        }

        await channel.send({
          type: "broadcast",
          event: `private:${activePlayer.id}:night:action_required`,
          payload: actionPayload,
        });
      }
    }

    // Update snapshot in DB
    await admin
      .from("games")
      .update({ state_snapshot: snapshot })
      .eq("id", gameId);

    return new Response(
      JSON.stringify({ received: true, nextStep: snapshot.currentNightStep }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
git add supabase/functions/night-action/
git commit -m "feat: add night-action Edge Function with full night orchestration"
```

---

### Task 4: Edge Function — `cast-vote`

**Files:**
- Create: `supabase/functions/cast-vote/index.ts`

- [ ] **Step 1: Write the cast-vote Edge Function**

Handles day voting: records votes, resolves when all living players have voted.

```typescript
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

    const { gameId, targetId } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "day") {
      return new Response(JSON.stringify({ error: "Game not in day phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = game.state_snapshot || {};
    const { data: player } = await admin
      .from("players")
      .select("id, role, is_alive")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player || !player.is_alive) {
      return new Response(JSON.stringify({ error: "Player not alive" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if village_idiot has lost voting rights
    if (player.role === "village_idiot" && snapshot.villageIdiotRevealed) {
      return new Response(JSON.stringify({ error: "Village idiot cannot vote" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store vote
    await admin.from("actions").insert({
      game_id: gameId,
      player_id: player.id,
      action_type: "vote",
      payload: { targetId: targetId || null }, // null = abstention
      phase: "day",
      turn: snapshot.turn || 1,
    });

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, role, is_alive")
      .eq("game_id", gameId);

    const alivePlayers = (allPlayers || []).filter((p: any) => p.is_alive);
    const eligibleVoters = alivePlayers.filter(
      (p: any) => !(p.role === "village_idiot" && snapshot.villageIdiotRevealed)
    );

    // Get all votes for this turn
    const { data: allVotes } = await admin
      .from("actions")
      .select("player_id, payload")
      .eq("game_id", gameId)
      .eq("action_type", "vote")
      .eq("phase", "day")
      .eq("turn", snapshot.turn || 1);

    const channel = admin.channel(`game:${gameId}`);

    // Broadcast vote progress
    await channel.send({
      type: "broadcast",
      event: "vote:status",
      payload: {
        votedCount: (allVotes || []).length,
        totalVoters: eligibleVoters.length,
      },
    });

    // Check if all eligible voters have voted
    if ((allVotes || []).length < eligibleVoters.length) {
      return new Response(
        JSON.stringify({ received: true, waitingForOthers: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tally votes
    const voteTally: Record<string, number> = {};
    const voteDetails: Record<string, string> = {};

    for (const v of allVotes || []) {
      const tid = (v.payload as any)?.targetId;
      voteDetails[v.player_id] = tid || "abstain";
      if (tid) {
        voteTally[tid] = (voteTally[tid] || 0) + 1;
      }
    }

    // Apply raven bonus
    if (snapshot.ravenTarget && voteTally[snapshot.ravenTarget] !== undefined) {
      voteTally[snapshot.ravenTarget] += 2;
    } else if (snapshot.ravenTarget) {
      voteTally[snapshot.ravenTarget] = 2;
    }

    // Find max votes
    let maxVotes = 0;
    let candidates: string[] = [];
    for (const [tid, count] of Object.entries(voteTally)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [tid];
      } else if (count === maxVotes) {
        candidates.push(tid);
      }
    }

    // Tie = no elimination
    let eliminatedId: string | null = null;
    let villageIdiotSurvived = false;

    if (candidates.length === 1 && maxVotes > 0) {
      eliminatedId = candidates[0];

      // Check village idiot
      const eliminatedPlayer = (allPlayers || []).find((p: any) => p.id === eliminatedId);
      if (eliminatedPlayer?.role === "village_idiot" && !snapshot.villageIdiotRevealed) {
        villageIdiotSurvived = true;
        snapshot.villageIdiotRevealed = true;
        eliminatedId = null;
      }
    }

    const deaths: string[] = [];
    let hunterTriggered = false;

    if (eliminatedId) {
      deaths.push(eliminatedId);

      // Elder killed by village check
      const eliminatedPlayer = (allPlayers || []).find((p: any) => p.id === eliminatedId);
      if (eliminatedPlayer?.role === "elder") {
        snapshot.elderKilledByVillage = true;
      }

      // Lovers cascade
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        if (l1 === eliminatedId && !deaths.includes(l2)) {
          deaths.push(l2);
        } else if (l2 === eliminatedId && !deaths.includes(l1)) {
          deaths.push(l1);
        }
      }

      // Apply deaths
      for (const deadId of deaths) {
        await admin.from("players").update({ is_alive: false }).eq("id", deadId);
      }

      // Hunter check
      hunterTriggered = deaths.some((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return p?.role === "hunter";
      });
    }

    // Check winner
    const updatedPlayers = (allPlayers || []).map((p: any) => ({
      ...p,
      is_alive: deaths.includes(p.id) ? false : p.is_alive,
    }));
    const aliveWolves = updatedPlayers.filter((p: any) => p.is_alive && p.role === "werewolf");
    const aliveVillage = updatedPlayers.filter((p: any) => p.is_alive && p.role !== "werewolf");
    const aliveAll = updatedPlayers.filter((p: any) => p.is_alive);

    let winner: string | null = null;
    if (aliveWolves.length === 0) winner = "villagers";
    else if (aliveVillage.length === 0) winner = "werewolves";

    if (!winner && snapshot.lovers) {
      const [l1, l2] = snapshot.lovers;
      const l1p = updatedPlayers.find((p: any) => p.id === l1);
      const l2p = updatedPlayers.find((p: any) => p.id === l2);
      if (l1p && l2p) {
        const isMixed = (l1p.role === "werewolf") !== (l2p.role === "werewolf");
        if (isMixed && l1p.is_alive && l2p.is_alive && aliveAll.length === 2) {
          winner = "lovers";
        }
      }
    }

    // Determine next phase
    let nextPhase = "night";
    if (winner) nextPhase = "end";
    else if (hunterTriggered) nextPhase = "hunter";

    const nextTurn = (snapshot.turn || 1) + (nextPhase === "night" ? 1 : 0);
    snapshot.turn = nextTurn;
    snapshot.ravenTarget = null;
    snapshot.isFirstNight = false;

    await admin
      .from("games")
      .update({
        phase: nextPhase,
        state_snapshot: snapshot,
        ...(winner ? { status: "finished" } : {}),
      })
      .eq("id", gameId);

    const eliminatedPlayer = eliminatedId ? (allPlayers || []).find((p: any) => p.id === eliminatedId) : null;

    await channel.send({
      type: "broadcast",
      event: "vote:result",
      payload: {
        eliminated: eliminatedPlayer ? { id: eliminatedPlayer.id, name: eliminatedPlayer.name } : null,
        voteDetails,
        villageIdiotSurvived,
      },
    });

    await channel.send({
      type: "broadcast",
      event: "game:state",
      payload: {
        alivePlayers: updatedPlayers.filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name })),
        nightDeaths: [],
        winner,
      },
    });

    await channel.send({
      type: "broadcast",
      event: "game:phase",
      payload: { phase: nextPhase, turn: nextTurn },
    });

    return new Response(
      JSON.stringify({ resolved: true, eliminated: eliminatedPlayer?.name, winner }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
git add supabase/functions/cast-vote/
git commit -m "feat: add cast-vote Edge Function with day voting resolution"
```

---

### Task 5: Edge Function — `hunter-shoot`

**Files:**
- Create: `supabase/functions/hunter-shoot/index.ts`

- [ ] **Step 1: Write the hunter-shoot Edge Function**

```typescript
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

    const { gameId, targetId } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "hunter") {
      return new Response(JSON.stringify({ error: "Game not in hunter phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: player } = await admin
      .from("players")
      .select("id, role, user_id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player || player.role !== "hunter") {
      return new Response(JSON.stringify({ error: "Not the hunter" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = game.state_snapshot || {};
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, role, is_alive")
      .eq("game_id", gameId);

    const deaths: string[] = [];

    if (targetId) {
      deaths.push(targetId);
      await admin.from("players").update({ is_alive: false }).eq("id", targetId);

      // Lovers cascade
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        if (l1 === targetId && !deaths.includes(l2)) {
          deaths.push(l2);
          await admin.from("players").update({ is_alive: false }).eq("id", l2);
        } else if (l2 === targetId && !deaths.includes(l1)) {
          deaths.push(l1);
          await admin.from("players").update({ is_alive: false }).eq("id", l1);
        }
      }
    }

    // Check winner
    const updatedPlayers = (allPlayers || []).map((p: any) => ({
      ...p,
      is_alive: deaths.includes(p.id) ? false : p.is_alive,
    }));
    const aliveWolves = updatedPlayers.filter((p: any) => p.is_alive && p.role === "werewolf");
    const aliveVillage = updatedPlayers.filter((p: any) => p.is_alive && p.role !== "werewolf");
    const aliveAll = updatedPlayers.filter((p: any) => p.is_alive);

    let winner: string | null = null;
    if (aliveWolves.length === 0) winner = "villagers";
    else if (aliveVillage.length === 0) winner = "werewolves";

    if (!winner && snapshot.lovers) {
      const [l1, l2] = snapshot.lovers;
      const l1p = updatedPlayers.find((p: any) => p.id === l1);
      const l2p = updatedPlayers.find((p: any) => p.id === l2);
      if (l1p && l2p) {
        const isMixed = (l1p.role === "werewolf") !== (l2p.role === "werewolf");
        if (isMixed && l1p.is_alive && l2p.is_alive && aliveAll.length === 2) {
          winner = "lovers";
        }
      }
    }

    // Determine next phase — if hunter was triggered during night, go to day; during day, go to night
    let nextPhase = winner ? "end" : (snapshot.hunterContext === "night" ? "day" : "night");
    const nextTurn = nextPhase === "night" ? (snapshot.turn || 1) + 1 : (snapshot.turn || 1);

    snapshot.turn = nextTurn;

    await admin
      .from("games")
      .update({
        phase: nextPhase,
        state_snapshot: snapshot,
        ...(winner ? { status: "finished" } : {}),
      })
      .eq("id", gameId);

    const channel = admin.channel(`game:${gameId}`);

    await channel.send({
      type: "broadcast",
      event: "game:state",
      payload: {
        alivePlayers: updatedPlayers.filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name })),
        nightDeaths: deaths.map((id: string) => {
          const p = (allPlayers || []).find((pl: any) => pl.id === id);
          return { id, name: p?.name || "?" };
        }),
        winner,
      },
    });

    await channel.send({
      type: "broadcast",
      event: "game:phase",
      payload: { phase: nextPhase, turn: nextTurn },
    });

    return new Response(
      JSON.stringify({ resolved: true, winner }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
git add supabase/functions/hunter-shoot/
git commit -m "feat: add hunter-shoot Edge Function"
```

---

### Task 6: Edge Functions — `sync-clock` and `reconnect`

**Files:**
- Create: `supabase/functions/sync-clock/index.ts`
- Create: `supabase/functions/reconnect/index.ts`

- [ ] **Step 1: Write sync-clock**

```typescript
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

    const { gameId, durationMs } = await req.json();
    const admin = getSupabaseAdmin();
    const channel = admin.channel(`game:${gameId}`);

    await channel.send({
      type: "broadcast",
      event: "timer:start",
      payload: { startedAt: Date.now(), durationMs },
    });

    return new Response(
      JSON.stringify({ synced: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 2: Write reconnect**

```typescript
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

    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: player } = await admin
      .from("players")
      .select("id, role, is_alive, name")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player) {
      return new Response(JSON.stringify({ error: "Player not in game" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as connected
    await admin
      .from("players")
      .update({ is_connected: true })
      .eq("id", player.id);

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, is_alive")
      .eq("game_id", gameId);

    return new Response(
      JSON.stringify({
        game: {
          id: game.id,
          code: game.code,
          status: game.status,
          phase: game.phase,
          settings: game.settings,
        },
        player: {
          id: player.id,
          role: player.role,
          isAlive: player.is_alive,
          name: player.name,
        },
        snapshot: game.state_snapshot,
        alivePlayers: (allPlayers || [])
          .filter((p: any) => p.is_alive)
          .map((p: any) => ({ id: p.id, name: p.name })),
        hostId: game.host_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/sync-clock/ supabase/functions/reconnect/
git commit -m "feat: add sync-clock and reconnect Edge Functions"
```

---

### Task 7: Hook — `useOnlineGame`

**Files:**
- Create: `hooks/useOnlineGame.ts`

- [ ] **Step 1: Write the main online game state hook**

This hook:
- Connects to the game's Realtime channel
- Listens to all public and private messages
- Maintains an `OnlineGameState` derived from broadcasts
- Exposes `sendAction()` to send actions to Edge Functions

```typescript
import { useState, useCallback, useMemo } from "react";
import { useChannel } from "./useChannel";
import { supabase } from "../lib/supabase";
import type {
  OnlineGameState,
  GamePhasePayload,
  GameStatePayload,
  NightStepPayload,
  VoteStatusPayload,
  VoteResultPayload,
  TimerStartPayload,
  GamePausedPayload,
  RoleAssignPayload,
  NightActionRequiredPayload,
  NightActionResultPayload,
  LoversRevealPayload,
  WolfVoteUpdatePayload,
  LittleGirlCluePayload,
} from "../types/online";

const INITIAL_STATE: OnlineGameState = {
  gameId: "",
  playerId: "",
  isHost: false,
  phase: "distribution",
  turn: 0,
  nightStep: null,
  myRole: null,
  myRoleDescription: null,
  isAlive: true,
  alivePlayers: [],
  nightDeaths: [],
  winner: null,
  actionRequired: null,
  actionResult: null,
  wolfVotes: {},
  littleGirlClue: [],
  loversReveal: null,
  voteStatus: null,
  voteResult: null,
  debateTimer: null,
  pauseInfo: null,
};

interface UseOnlineGameOptions {
  gameId: string;
  playerId: string;
  isHost: boolean;
}

export function useOnlineGame({ gameId, playerId, isHost }: UseOnlineGameOptions) {
  const [state, setState] = useState<OnlineGameState>({
    ...INITIAL_STATE,
    gameId,
    playerId,
    isHost,
  });

  const onMessage = useMemo(() => ({
    // ── Public events ───────────────────────────────────────────────────
    "game:phase": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GamePhasePayload;
      setState((prev) => ({
        ...prev,
        phase: data.phase as OnlineGameState["phase"],
        turn: data.turn,
        nightStep: data.nightStep ?? null,
        // Reset per-phase state
        actionRequired: null,
        actionResult: null,
        wolfVotes: {},
        littleGirlClue: [],
        voteStatus: null,
        voteResult: null,
        debateTimer: null,
        pauseInfo: null,
      }));
    },

    "game:state": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GameStatePayload;
      setState((prev) => ({
        ...prev,
        alivePlayers: data.alivePlayers,
        nightDeaths: data.nightDeaths,
        winner: data.winner ?? null,
        isAlive: data.alivePlayers.some((p) => p.id === playerId),
      }));
    },

    "night:step": (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightStepPayload;
      setState((prev) => ({
        ...prev,
        nightStep: data.step,
        actionRequired: null,
        actionResult: null,
      }));
    },

    "vote:status": (payload: Record<string, unknown>) => {
      const data = payload as unknown as VoteStatusPayload;
      setState((prev) => ({ ...prev, voteStatus: data }));
    },

    "vote:result": (payload: Record<string, unknown>) => {
      const data = payload as unknown as VoteResultPayload;
      setState((prev) => ({ ...prev, voteResult: data }));
    },

    "timer:start": (payload: Record<string, unknown>) => {
      const data = payload as unknown as TimerStartPayload;
      setState((prev) => ({ ...prev, debateTimer: data }));
    },

    "game:paused": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GamePausedPayload;
      setState((prev) => ({ ...prev, phase: "paused", pauseInfo: data }));
    },

    "game:resumed": () => {
      setState((prev) => ({ ...prev, pauseInfo: null }));
    },

    // ── Private events (prefixed with player ID) ────────────────────────
    [`private:${playerId}:role:assign`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as RoleAssignPayload;
      setState((prev) => ({
        ...prev,
        myRole: data.role,
        myRoleDescription: data.description,
      }));
    },

    [`private:${playerId}:night:action_required`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightActionRequiredPayload;
      setState((prev) => ({ ...prev, actionRequired: data, actionResult: null }));
    },

    [`private:${playerId}:night:action_result`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightActionResultPayload;
      setState((prev) => ({ ...prev, actionResult: data }));
    },

    [`private:${playerId}:lovers:reveal`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as LoversRevealPayload;
      setState((prev) => ({ ...prev, loversReveal: data }));
    },

    [`private:${playerId}:wolf:vote_update`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as WolfVoteUpdatePayload;
      setState((prev) => ({ ...prev, wolfVotes: data.votes }));
    },

    [`private:${playerId}:little_girl:clue`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as LittleGirlCluePayload;
      setState((prev) => ({ ...prev, littleGirlClue: data.clueNames }));
    },
  }), [playerId]);

  useChannel({
    channelName: `game:${gameId}`,
    onMessage,
    enabled: !!gameId,
  });

  const sendAction = useCallback(async (
    functionName: string,
    body: Record<string, unknown>
  ) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { gameId, ...body },
    });
    if (error) throw error;
    return data;
  }, [gameId]);

  return { state, sendAction };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useOnlineGame.ts
git commit -m "feat: add useOnlineGame hook for real-time game state"
```

---

### Task 8: ActionTimer component

**Files:**
- Create: `components/online/ActionTimer.tsx`

- [ ] **Step 1: Write the countdown timer component**

```tsx
import { useState, useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface ActionTimerProps {
  seconds: number;
  onExpire: () => void;
}

export default function ActionTimer({ seconds, onExpire }: ActionTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const isUrgent = remaining <= 5;

  return (
    <Text style={[styles.timer, isUrgent && styles.urgent]}>
      {remaining}s
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginVertical: 8,
  },
  urgent: {
    color: colors.danger,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/online/ActionTimer.tsx
git commit -m "feat: add ActionTimer countdown component"
```

---

### Task 9: Online game sub-view components

**Files:**
- Create: `components/online/DistributionView.tsx`
- Create: `components/online/NightWaitView.tsx`
- Create: `components/online/NightActionView.tsx`
- Create: `components/online/WolfVoteView.tsx`
- Create: `components/online/LittleGirlView.tsx`
- Create: `components/online/DayAnnouncementView.tsx`
- Create: `components/online/DayDebateView.tsx`
- Create: `components/online/DayVoteView.tsx`
- Create: `components/online/HunterView.tsx`
- Create: `components/online/SpectatorView.tsx`
- Create: `components/online/EndView.tsx`
- Create: `components/online/PausedView.tsx`

- [ ] **Step 1: Create DistributionView.tsx**

Shows the player their assigned role with a "Compris" button.

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  role: string | null;
  description: string | null;
  onReady: () => void;
}

export default function DistributionView({ role, description, onReady }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ton role</Text>
      <Text style={styles.role}>{role ?? "..."}</Text>
      <Text style={styles.description}>{description ?? ""}</Text>
      <Pressable style={styles.button} onPress={onReady}>
        <Text style={styles.buttonText}>Compris</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.textSecondary, marginBottom: 16 },
  role: { fontSize: 36, fontWeight: "bold", color: colors.primary, marginBottom: 12 },
  description: { fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
});
```

- [ ] **Step 2: Create NightWaitView.tsx**

```tsx
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NightStep } from "../../game/nightEngine";

const STEP_LABELS: Record<string, string> = {
  intro: "La nuit tombe sur le village...",
  cupid: "Cupidon ouvre les yeux...",
  lovers_reveal: "Les amoureux se decouvrent...",
  seer: "La Voyante ouvre les yeux...",
  savior: "Le Salvateur ouvre les yeux...",
  werewolves: "Les Loups-Garous ouvrent les yeux...",
  witch: "La Sorciere ouvre les yeux...",
  raven: "Le Corbeau ouvre les yeux...",
  little_girl: "La Petite Fille entrouvre les yeux...",
  resolution: "Le soleil se leve...",
};

interface Props {
  step: NightStep | null;
}

export default function NightWaitView({ step }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{step ? STEP_LABELS[step] || step : "..."}</Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  text: { fontFamily: fonts.cinzelBold, fontSize: 22, color: colors.primary, textAlign: "center" },
});
```

- [ ] **Step 3: Create NightActionView.tsx**

```tsx
import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function NightActionView({ action, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    const actionMap: Record<string, string> = {
      seer: "seer_inspect",
      savior: "savior_protect",
      raven: "raven_mark",
    };
    const actionType = actionMap[action.step] || action.step;
    onSubmit(actionType, { targetId: selected });
  };

  const handleTimeout = () => {
    // Default action: do nothing
    const actionMap: Record<string, string> = {
      seer: "seer_inspect",
      savior: "savior_protect",
      raven: "raven_mark",
    };
    const actionType = actionMap[action.step] || action.step;
    onSubmit(actionType, { targetId: null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{action.instruction}</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />
      <FlatList
        data={action.targets}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.playerRow, selected === item.id && styles.selected]}
            onPress={() => setSelected(item.id)}
          >
            <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Confirmer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  instruction: { fontSize: 18, color: colors.text, textAlign: "center", marginBottom: 8 },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.primary },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.black },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
```

- [ ] **Step 4: Create WolfVoteView.tsx**

```tsx
import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  wolfVotes: Record<string, number>;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function WolfVoteView({ action, wolfVotes, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (targetId: string) => {
    setSelected(targetId);
    onSubmit("werewolf_target", { targetId });
  };

  const handleTimeout = () => {
    if (!selected) {
      // Pick first target as default
      const firstTarget = action.targets[0];
      if (firstTarget) onSubmit("werewolf_target", { targetId: firstTarget.id });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{action.instruction}</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />
      <FlatList
        data={action.targets}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const voteCount = wolfVotes[item.id] || 0;
          return (
            <Pressable
              style={[styles.playerRow, selected === item.id && styles.selected]}
              onPress={() => handleSelect(item.id)}
            >
              <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
                {item.name}
              </Text>
              {voteCount > 0 && (
                <Text style={styles.voteCount}>
                  {"🐺".repeat(voteCount)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  instruction: { fontSize: 18, color: colors.text, textAlign: "center", marginBottom: 8 },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  voteCount: { fontSize: 16 },
});
```

- [ ] **Step 5: Create remaining view components**

Create `LittleGirlView.tsx`:
```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";

interface Props {
  clueNames: string[];
  onDone: () => void;
  timerSeconds: number;
}

export default function LittleGirlView({ clueNames, onDone, timerSeconds }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu apercois des silhouettes...</Text>
      <ActionTimer seconds={timerSeconds} onExpire={onDone} />
      {clueNames.map((name, idx) => (
        <View key={idx} style={styles.clue}>
          <Text style={styles.clueName}>{name}</Text>
        </View>
      ))}
      <Pressable style={styles.button} onPress={onDone}>
        <Text style={styles.buttonText}>Refermer les yeux</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, color: colors.primary, marginBottom: 16, textAlign: "center" },
  clue: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8, width: "100%" },
  clueName: { fontSize: 18, color: colors.text, textAlign: "center" },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 24 },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
```

Create `DayAnnouncementView.tsx`:
```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  nightDeaths: { id: string; name: string }[];
  onContinue: () => void;
}

export default function DayAnnouncementView({ nightDeaths, onContinue }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le village se reveille...</Text>
      {nightDeaths.length === 0 ? (
        <Text style={styles.message}>Personne n'est mort cette nuit !</Text>
      ) : (
        nightDeaths.map((d) => (
          <Text key={d.id} style={styles.death}>{d.name} a ete elimine(e)</Text>
        ))
      )}
      <Pressable style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Debat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  message: { fontSize: 18, color: colors.success, marginBottom: 16 },
  death: { fontSize: 18, color: colors.danger, marginBottom: 8 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
});
```

Create `DayDebateView.tsx`:
```tsx
import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { TimerStartPayload } from "../../types/online";

interface Props {
  timer: TimerStartPayload | null;
}

export default function DayDebateView({ timer }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!timer) return;
    const update = () => {
      const elapsed = Date.now() - timer.startedAt;
      const left = Math.max(0, Math.ceil((timer.durationMs - elapsed) / 1000));
      setRemaining(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debat en cours</Text>
      <Text style={styles.timer}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>
      <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  timer: { fontSize: 64, fontWeight: "bold", color: colors.text },
  hint: { fontSize: 16, color: colors.textSecondary, marginTop: 24 },
});
```

Create `DayVoteView.tsx`:
```tsx
import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";

interface Props {
  alivePlayers: { id: string; name: string }[];
  myPlayerId: string;
  onVote: (targetId: string | null) => void;
}

export default function DayVoteView({ alivePlayers, myPlayerId, onVote }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const handleVote = () => {
    setVoted(true);
    onVote(selected);
  };

  const handleTimeout = () => {
    if (!voted) {
      setVoted(true);
      onVote(null); // Abstention
    }
  };

  const others = alivePlayers.filter((p) => p.id !== myPlayerId);

  if (voted) {
    return (
      <View style={styles.container}>
        <Text style={styles.waiting}>Vote enregistre. En attente des autres...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vote</Text>
      <ActionTimer seconds={15} onExpire={handleTimeout} />
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.playerRow, selected === item.id && styles.selected]}
            onPress={() => setSelected(item.id)}
          >
            <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <View style={styles.actions}>
        <Pressable style={styles.voteButton} onPress={handleVote}>
          <Text style={styles.buttonText}>{selected ? "Voter" : "S'abstenir"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.primary, textAlign: "center", marginBottom: 8 },
  waiting: { fontSize: 18, color: colors.textSecondary, textAlign: "center" },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  actions: { paddingTop: 12 },
  voteButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
```

Create `HunterView.tsx`:
```tsx
import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";

interface Props {
  isHunter: boolean;
  alivePlayers: { id: string; name: string }[];
  myPlayerId: string;
  onShoot: (targetId: string | null) => void;
}

export default function HunterView({ isHunter, alivePlayers, myPlayerId, onShoot }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!isHunter) {
    return (
      <View style={styles.container}>
        <Text style={styles.waiting}>Le Chasseur choisit sa cible...</Text>
      </View>
    );
  }

  const others = alivePlayers.filter((p) => p.id !== myPlayerId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu es le Chasseur !</Text>
      <Text style={styles.instruction}>Choisis qui emporter avec toi.</Text>
      <ActionTimer seconds={15} onExpire={() => onShoot(null)} />
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.playerRow, selected === item.id && styles.selected]}
            onPress={() => setSelected(item.id)}
          >
            <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={() => onShoot(selected)}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Tirer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: colors.danger, textAlign: "center", marginBottom: 8 },
  instruction: { fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 8 },
  waiting: { fontSize: 18, color: colors.textSecondary, textAlign: "center" },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  button: { backgroundColor: colors.danger, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "bold" },
});
```

Create `SpectatorView.tsx`:
```tsx
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import type { NightStep } from "../../game/nightEngine";

interface Props {
  phase: string;
  nightStep: NightStep | null;
}

export default function SpectatorView({ phase, nightStep }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.skull}>💀</Text>
      <Text style={styles.title}>Tu es elimine(e)</Text>
      <Text style={styles.info}>
        {phase === "night" ? `Nuit en cours${nightStep ? ` — ${nightStep}` : ""}` : "Jour en cours"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  skull: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.textSecondary },
  info: { fontSize: 16, color: colors.textMuted, marginTop: 12 },
});
```

Create `EndView.tsx`:
```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  winner: "werewolves" | "villagers" | "lovers" | null;
}

const WINNER_TEXT = {
  werewolves: "Les Loups-Garous ont devore le village !",
  villagers: "Le village a triomphe des loups !",
  lovers: "Les Amoureux ont survecu ensemble !",
};

export default function EndView({ winner }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fin de la partie</Text>
      <Text style={styles.result}>
        {winner ? WINNER_TEXT[winner] : "Match nul"}
      </Text>
      <Pressable style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Retour a l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 28, color: colors.primary, marginBottom: 24 },
  result: { fontSize: 20, color: colors.text, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
});
```

Create `PausedView.tsx`:
```tsx
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import type { GamePausedPayload } from "../../types/online";

interface Props {
  info: GamePausedPayload;
}

export default function PausedView({ info }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partie en pause</Text>
      <Text style={styles.reason}>{info.disconnectedPlayer} a perdu la connexion</Text>
      <Text style={styles.timer}>Reprise dans {info.resumeIn}s...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: colors.warning, marginBottom: 16 },
  reason: { fontSize: 18, color: colors.text, marginBottom: 12 },
  timer: { fontSize: 24, color: colors.primary },
});
```

- [ ] **Step 6: Commit all view components**

```bash
git add components/online/
git commit -m "feat: add all online game sub-view components"
```

---

### Task 10: Main online game screen

**Files:**
- Create: `app/online/game.tsx`

- [ ] **Step 1: Write game.tsx — the main orchestrator screen**

```tsx
import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOnlineGame } from "../../hooks/useOnlineGame";
import { useNarrator } from "../../hooks/useNarrator";
import { colors } from "../../theme/colors";

import DistributionView from "../../components/online/DistributionView";
import NightWaitView from "../../components/online/NightWaitView";
import NightActionView from "../../components/online/NightActionView";
import WolfVoteView from "../../components/online/WolfVoteView";
import LittleGirlView from "../../components/online/LittleGirlView";
import DayAnnouncementView from "../../components/online/DayAnnouncementView";
import DayDebateView from "../../components/online/DayDebateView";
import DayVoteView from "../../components/online/DayVoteView";
import HunterView from "../../components/online/HunterView";
import SpectatorView from "../../components/online/SpectatorView";
import EndView from "../../components/online/EndView";
import PausedView from "../../components/online/PausedView";

type DaySubPhase = "announcement" | "debate" | "vote";

export default function OnlineGameScreen() {
  const params = useLocalSearchParams<{
    gameId: string;
    playerId: string;
    isHost: string;
  }>();

  const isHost = params.isHost === "true";
  const { state, sendAction } = useOnlineGame({
    gameId: params.gameId,
    playerId: params.playerId,
    isHost,
  });

  const [daySubPhase, setDaySubPhase] = useState<DaySubPhase>("announcement");

  // Host plays narrator audio
  if (isHost && state.nightStep) {
    // useNarrator is called at the top level in the local version
    // For online, we conditionally use it only for the host
  }

  const handleNightAction = useCallback(async (actionType: string, payload: Record<string, unknown>) => {
    await sendAction("night-action", { actionType, payload });
  }, [sendAction]);

  const handleVote = useCallback(async (targetId: string | null) => {
    await sendAction("cast-vote", { targetId });
  }, [sendAction]);

  const handleHunterShoot = useCallback(async (targetId: string | null) => {
    await sendAction("hunter-shoot", { targetId });
  }, [sendAction]);

  const handleStartDebate = useCallback(async () => {
    setDaySubPhase("debate");
    if (isHost) {
      const durationMs = 3 * 60 * 1000; // TODO: use game settings
      await sendAction("sync-clock", { durationMs });
    }
  }, [isHost, sendAction]);

  const handleStartVote = useCallback(() => {
    setDaySubPhase("vote");
  }, []);

  // ── Paused ──────────────────────────────────────────────────────────────
  if (state.phase === "paused" && state.pauseInfo) {
    return (
      <View style={styles.container}>
        <PausedView info={state.pauseInfo} />
      </View>
    );
  }

  // ── End ─────────────────────────────────────────────────────────────────
  if (state.phase === "end" || state.winner) {
    return (
      <View style={styles.container}>
        <EndView winner={state.winner} />
      </View>
    );
  }

  // ── Dead player ─────────────────────────────────────────────────────────
  if (!state.isAlive) {
    return (
      <View style={styles.container}>
        <SpectatorView phase={state.phase} nightStep={state.nightStep} />
      </View>
    );
  }

  // ── Distribution ────────────────────────────────────────────────────────
  if (state.phase === "distribution") {
    return (
      <View style={styles.container}>
        <DistributionView
          role={state.myRole}
          description={state.myRoleDescription}
          onReady={() => sendAction("night-action", { actionType: "ready", payload: {} })}
        />
      </View>
    );
  }

  // ── Hunter ──────────────────────────────────────────────────────────────
  if (state.phase === "hunter") {
    return (
      <View style={styles.container}>
        <HunterView
          isHunter={state.myRole === "hunter"}
          alivePlayers={state.alivePlayers}
          myPlayerId={params.playerId}
          onShoot={handleHunterShoot}
        />
      </View>
    );
  }

  // ── Night ───────────────────────────────────────────────────────────────
  if (state.phase === "night") {
    // Little girl has her own view
    if (state.nightStep === "little_girl" && state.myRole === "little_girl" && state.littleGirlClue.length > 0) {
      return (
        <View style={styles.container}>
          <LittleGirlView
            clueNames={state.littleGirlClue}
            timerSeconds={15}
            onDone={() => handleNightAction("little_girl_done", {})}
          />
        </View>
      );
    }

    // Wolf vote
    if (state.actionRequired && state.nightStep === "werewolves" && state.myRole === "werewolf") {
      return (
        <View style={styles.container}>
          <WolfVoteView
            action={state.actionRequired}
            wolfVotes={state.wolfVotes}
            onSubmit={handleNightAction}
          />
        </View>
      );
    }

    // Witch special handling
    if (state.actionRequired && state.nightStep === "witch" && state.myRole === "witch") {
      return (
        <View style={styles.container}>
          <NightActionView
            action={state.actionRequired}
            onSubmit={(_, payload) => handleNightAction("witch_action", payload)}
          />
        </View>
      );
    }

    // Generic night action (seer, savior, cupid, raven)
    if (state.actionRequired) {
      return (
        <View style={styles.container}>
          <NightActionView
            action={state.actionRequired}
            onSubmit={handleNightAction}
          />
        </View>
      );
    }

    // Waiting
    return (
      <View style={styles.container}>
        <NightWaitView step={state.nightStep} />
      </View>
    );
  }

  // ── Day ─────────────────────────────────────────────────────────────────
  if (state.phase === "day") {
    if (state.voteResult) {
      // Show result briefly then it transitions
      return (
        <View style={styles.container}>
          <DayAnnouncementView
            nightDeaths={state.voteResult.eliminated
              ? [{ id: state.voteResult.eliminated.id, name: state.voteResult.eliminated.name }]
              : []
            }
            onContinue={() => {}}
          />
        </View>
      );
    }

    if (daySubPhase === "announcement") {
      return (
        <View style={styles.container}>
          <DayAnnouncementView
            nightDeaths={state.nightDeaths}
            onContinue={handleStartDebate}
          />
        </View>
      );
    }

    if (daySubPhase === "debate") {
      return (
        <View style={styles.container}>
          <DayDebateView timer={state.debateTimer} />
        </View>
      );
    }

    if (daySubPhase === "vote") {
      return (
        <View style={styles.container}>
          <DayVoteView
            alivePlayers={state.alivePlayers}
            myPlayerId={params.playerId}
            onVote={handleVote}
          />
        </View>
      );
    }
  }

  // Fallback
  return (
    <View style={styles.container}>
      <NightWaitView step={null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
```

- [ ] **Step 2: Register game screen in online layout**

In `app/online/_layout.tsx`, add:
```tsx
<Stack.Screen name="game" options={{ title: "Partie", headerShown: false }} />
```

- [ ] **Step 3: Commit**

```bash
git add app/online/game.tsx app/online/_layout.tsx
git commit -m "feat: add main online game screen with all phase routing"
```

---

### Task 11: Wire up lobby start-game

**Files:**
- Modify: `app/online/lobby.tsx`

- [ ] **Step 1: Replace the placeholder `handleStart` in lobby.tsx**

Update `handleStart` to call the start-game Edge Function and navigate to the game screen:

```typescript
const handleStart = async () => {
  if (players.length < 6) {
    Alert.alert("Pas assez de joueurs", "Il faut au moins 6 joueurs pour commencer.");
    return;
  }

  try {
    const { error } = await supabase.functions.invoke("start-game", {
      body: {
        gameId: params.gameId,
        settings: {
          selectedRoles: [], // TODO: role selection UI in Plan 3
          debateTimerMinutes: 3,
        },
      },
    });

    if (error) throw error;

    router.replace({
      pathname: "/online/game",
      params: {
        gameId: params.gameId,
        playerId: params.playerId,
        isHost: "true",
      },
    });
  } catch (err) {
    Alert.alert("Erreur", (err as Error).message);
  }
};
```

Also listen for `game:phase` in the channel handlers so non-host players navigate to the game screen when the host starts:

```typescript
"game:phase": useCallback((payload: Record<string, unknown>) => {
  if ((payload as any).phase === "distribution") {
    router.replace({
      pathname: "/online/game",
      params: {
        gameId: params.gameId,
        playerId: params.playerId,
        isHost: params.isHost,
      },
    });
  }
}, [router, params]),
```

- [ ] **Step 2: Commit**

```bash
git add app/online/lobby.tsx
git commit -m "feat: wire lobby start-game to Edge Function and auto-navigate"
```

---

### Task 12: Verify — tests and types

- [ ] **Step 1: Run tests**

```bash
npx jest
```

Expected: All existing tests pass (online code is additive, no local code changed).

- [ ] **Step 2: Run type checker**

```bash
npx tsc --noEmit
```

Expected: No errors (Edge Functions excluded via tsconfig).

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete online game engine (Plan 2)"
```
