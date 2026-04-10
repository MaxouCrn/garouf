# Online Multiplayer Mode — Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Scope:** Add online multiplayer mode to the existing Loup-Garou app while preserving the local single-phone mode.

---

## 1. Overview

### Goal

Transform the single-phone Loup-Garou game into a multi-device experience where each player uses their own phone. One player creates a game lobby, others join via code or QR, and the entire game is synchronized in real-time across all devices.

### Key Decisions

| Aspect | Decision |
|---|---|
| Mode | Online added alongside local mode (both coexist) |
| Backend | Supabase (Postgres + Realtime Broadcast + Edge Functions) |
| Architecture | Server-authoritative — all game logic runs in Edge Functions |
| Auth | Supabase Anonymous Auth + player-chosen display name |
| Join mechanism | 6-character text code + QR Code |
| Communication | Supabase Realtime Broadcast (public + private messages) |
| Audio | Host device only — zero sound on other phones (no notifications, no vibration) |
| Night phase | Waiting screen for all, action screen for active role only |
| Action timer | 15 seconds per role, 30 seconds for werewolves |
| Day phase | IRL debate + simultaneous secret vote on each phone |
| Reconnection | Auto-pause 60s if a living player disconnects, then host decides |
| Shared code | `roles.ts`, `nightEngine.ts`, `resolution.ts`, `balance.ts` reused server-side |

---

## 2. Database Schema (Supabase)

### Table: `games`

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique game ID |
| `code` | text (unique, 6 chars) | Join code (e.g., "LOUP42") |
| `status` | text | `lobby` → `playing` → `finished` |
| `host_id` | uuid (FK → players) | Player who created the game |
| `phase` | text | Current phase (setup_roles, distribution, night, day, hunter, end) |
| `state_snapshot` | jsonb | Latest game state snapshot (for reconnection) |
| `settings` | jsonb | Game config (debate timer, selected roles) |
| `created_at` | timestamptz | Timestamp |

### Table: `players`

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique player ID |
| `game_id` | uuid (FK → games) | Game joined |
| `user_id` | uuid (FK → auth.users) | Supabase Anonymous Auth ID |
| `name` | text | Display name |
| `role` | text (nullable) | Assigned role (null until distribution) |
| `is_alive` | boolean | Alive or eliminated |
| `is_connected` | boolean | Currently connected to Realtime channel |
| `joined_at` | timestamptz | Timestamp |

### Table: `actions`

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Unique ID |
| `game_id` | uuid (FK → games) | Game |
| `player_id` | uuid (FK → players) | Acting player |
| `action_type` | text | Action type (vote, werewolf_target, seer_inspect, etc.) |
| `payload` | jsonb | Action data (target_id, etc.) |
| `phase` | text | Phase when action occurred |
| `turn` | integer | Game turn |
| `created_at` | timestamptz | Timestamp |

### Row Level Security (RLS)

- **`games`**: Anyone can read a game by its code. Only Edge Functions (service_role) can modify.
- **`players`**: A player can see public columns (name, is_alive) of all players in their game. The `role` column is only visible to the player themselves (`user_id = auth.uid()`). Edge Functions have full access.
- **`actions`**: Insert and read only via Edge Functions. No direct client access.

---

## 3. Edge Functions

### Lobby Management

| Function | Trigger | Behavior |
|---|---|---|
| `create-game` | Host taps "Create" | Generates code, creates game in `lobby` status, inserts host into `players` |
| `join-game` | Player enters code | Validates code, adds player, broadcasts updated player list |
| `leave-game` | Player leaves | Removes player. If host leaves, transfers to oldest player or closes game |
| `start-game` | Host taps "Start" | Validates (enough players, roles configured), runs `assignRoles()`, sends private `role:assign` to each player, transitions to `distribution` phase |

### Night Phase

| Function | Trigger | Behavior |
|---|---|---|
| `night-action` | A role submits their action | Validates: correct phase, correct role, valid target, within timer. Stores action. When all actions for current step are received → advances to next step, broadcasts. When the last step completes, executes `resolveNight()`, computes deaths, broadcasts results, transitions to `day` phase, writes DB snapshot. |

### Day Phase

| Function | Trigger | Behavior |
|---|---|---|
| `cast-vote` | A player votes | Records vote. When all living players have voted → computes result (majority + raven bonus), executes `resolveVote()`, broadcasts result. |
| `hunter-shoot` | Hunter dies | Triggered automatically. Waits for hunter action (15s timer), resolves, broadcasts. |

### Utilities

| Function | Trigger | Behavior |
|---|---|---|
| `reconnect` | Client reconnects | Reads latest `state_snapshot` + current phase/step, returns full state to client |
| `sync-clock` | Debate starts | Broadcasts debate timer start timestamp for synchronized countdown |

### Shared Game Logic

Edge Functions import the existing pure TypeScript functions directly:

- `game/roles.ts` — Role definitions and metadata
- `game/nightEngine.ts` — `buildNightSteps()`
- `game/resolution.ts` — `resolveNight()`, `resolveVote()`, `generateLittleGirlClue()`
- `game/balance.ts` — `getBalanceWarnings()`, presets

These functions have zero React dependencies and run unchanged server-side.

---

## 4. Realtime Communication

### Channel

Each game has one Realtime channel: `game:{game_id}`

### Public Messages (broadcast to all players)

| Event | Payload | When |
|---|---|---|
| `lobby:update` | `{players: [{id, name}]}` | Player joins/leaves lobby |
| `game:phase` | `{phase, turn, nightStep?}` | Phase or night step change |
| `game:state` | `{alivePlayers, nightDeaths, voteResult, winner?}` | Night/day resolution, public state update |
| `night:step` | `{step}` | New night step begins |
| `vote:status` | `{votedCount, totalVoters}` | Vote progress (no reveal of who voted what) |
| `vote:result` | `{eliminated, voteDetails}` | Vote result after everyone has voted |
| `timer:start` | `{startedAt, durationMs}` | Debate timer start, synchronized |
| `game:paused` | `{reason, disconnectedPlayer, resumeIn}` | Game paused due to disconnection |
| `game:resumed` | `{}` | Game resumed after reconnection |

### Private Messages (sent to one player only)

| Event | Payload | When |
|---|---|---|
| `role:assign` | `{role, description}` | Role distribution |
| `night:action_required` | `{step, targets[], instruction, timerSeconds}` | It's your turn to act |
| `night:action_result` | `{result}` | Result of your action (e.g., seer sees a role) |
| `lovers:reveal` | `{partnerName, isMixed}` | Cupid formed a couple, you discover your partner |
| `wolf:vote_update` | `{votes: {playerId: count}}` | Real-time wolf vote visibility (wolves only) |

---

## 5. Audio System

### Host Only

Only the host device plays audio. The existing `useNarrator` and `MusicContext` systems are reused with a simple `isHost` condition:

```typescript
// In useNarrator and MusicContext
if (!isHost) return; // Skip all audio loading and playback
```

This means:
- **Host**: Plays narrator voice lines, ambiance music, SFX — identical to current local behavior
- **Other players**: Zero audio, zero vibration, zero notification sounds

### Rationale

Players are in the same physical room. Audio from a specific phone would reveal which player has an active role. A single narrator device preserves the mystery, exactly like the physical board game.

---

## 6. Night Phase — Player Experience

### What Each Player Sees

| Situation | Screen |
|---|---|
| Not your turn | Waiting screen: "La Voyante ouvre les yeux..." with ambient animation |
| Your turn (non-wolf) | Action screen: list of players to choose from + 15-second timer |
| Your turn (wolf) | Action screen: list of players + real-time vote indicators from other wolves + 30-second timer |
| You are dead | Spectator screen: phases scroll by, no interaction possible |

### Werewolf Vote — Silent Communication

When it's the werewolves' turn:
- Each wolf sees the list of living players (non-wolf)
- When a wolf selects a target, the selection is instantly visible on other wolves' screens (e.g., a wolf icon indicator on the targeted player, count of wolves who selected them)
- Wolves can change their selection during the 30 seconds
- At timer expiry: majority wins. Tie → random wolf breaks it
- This enables silent, visual-only coordination — no sound, no movement

### Timer and Default Actions

| Role | Timer | Default (timeout) |
|---|---|---|
| Seer | 15s | Inspects nobody |
| Savior | 15s | Protects nobody |
| Witch (heal) | 15s | Does not heal |
| Witch (kill) | 15s | Does not kill |
| Cupid | 15s | Random pair |
| Raven | 15s | Marks nobody |
| Little Girl | 15s | Sees her clue (auto-displayed, timer is reading time only) |
| Werewolves | 30s | Majority vote, tie = random |
| Hunter | 15s | Does not shoot |
| Day vote | 15s | Abstention |

---

## 7. Day Phase — Debate and Vote

### Flow

1. **Announcement**: All players see night results (who died, how). Host plays narrator audio.
2. **Debate**: IRL conversation. Synchronized timer on all screens (from `sync-clock`). Players discuss, accuse, defend.
3. **Vote**: Timer expires → all living players see vote screen simultaneously. Each selects a player to eliminate (or abstains). 15-second timer.
4. **Result**: Once all votes are in, result is broadcast. Raven target gets +2 votes. Majority is eliminated. Tie → no elimination.
5. **Special cases**: Village Idiot survives first vote. Elder killed by village disables village powers. Hunter death triggers hunter phase. Lovers cascade applies.

---

## 8. Reconnection and Disconnection

### Auto-Pause on Disconnection

1. A player disconnects → server detects via Realtime Presence
2. **If player is alive** → game pauses automatically
3. All screens show: *"[Name] a perdu la connexion. Reprise dans 60s..."* with countdown
4. Player reconnects within 60s → game resumes where it left off
5. Timer expires → host sees two options:
   - **"Continuer sans lui"** → disconnected player uses default actions for the rest of the game
   - **"Arreter la partie"** → game ends, everyone returns to lobby

**If the disconnected player is dead** → no pause, they are a spectator, no impact on gameplay.

### Reconnection Flow

1. Client detects disconnection (Realtime channel dropped)
2. Shows "Reconnexion en cours..." screen with spinner
3. Auto-retry (3 attempts, 2-second interval)
4. On reconnect, calls `reconnect` Edge Function with `user_id`
5. Server returns latest `state_snapshot` + current phase/step
6. Client rebuilds screen and resumes

### DB Snapshots

Written at key moments to minimize writes:
- Game start (after role distribution)
- Start of each phase (night, day)
- Resolution (end of night, end of vote)
- Game end

Approximately 4-6 writes per turn. Well within Supabase free tier.

### Edge Cases

| Situation | Behavior |
|---|---|
| Host disconnects | Game continues — server orchestrates everything. Only narrator audio stops. If host returns, audio resumes at current step. |
| All players disconnect | Game remains in DB for 24 hours. If nobody returns, auto-cleaned. |
| Player force-quits and reopens app | Anonymous Auth persists on device. App detects active game on launch and offers to rejoin. |
| Player leaves permanently | Treated as disconnected. After pause + host decision, plays with default actions. No player replacement. |

---

## 9. Security and Anti-Cheat

### Principles

The server trusts no client. All sensitive information is controlled server-side.

### Information Visibility

| Information | Who sees it |
|---|---|
| Own role | Self only |
| Other players' roles | Nobody (except seer for inspected target) |
| Lover's identity | The two lovers only |
| Wolf targets (during vote) | Wolves only |
| Little girl clues | Little girl only |
| Alive/dead player list | Everyone |
| Vote results | Everyone (after all votes cast) |

### Edge Function Validations

Every Edge Function checks:
- **Identity**: JWT `user_id` matches the player claiming to act
- **Phase**: Action matches current phase (no voting during night)
- **Role**: Player has the right to act (only seer can inspect, only wolves vote for a target, etc.)
- **State**: Player is alive, target is valid, witch potions still available, etc.
- **Timing**: Action arrives within the allotted time (15s/30s)

### Scope of Protection

Security prevents **accidental cheating** (seeing a role you shouldn't) and guarantees **game integrity** (no invalid actions). It does not protect against determined reverse-engineering — acceptable for a social game among colleagues/friends.

---

## 10. Client-Side Architecture

### Modified Home Screen

`index.tsx` adds two new buttons:
- **"Creer une partie en ligne"** → navigates to `online/create.tsx`
- **"Rejoindre une partie"** → navigates to `online/join.tsx`

Existing **"Nouvelle partie"** button remains for local mode.

### New Screens

| Screen | Purpose |
|---|---|
| `app/online/create.tsx` | Host: configure roles + timer, display code + QR, see connected players, "Start" button |
| `app/online/join.tsx` | Enter code / scan QR, then enter display name |
| `app/online/lobby.tsx` | Waiting room: real-time player list, waiting for host to start |
| `app/online/game.tsx` | Main online game screen — dynamically renders sub-views based on phase and player role |

### Sub-Views in `game.tsx`

```
game.tsx
  ├── <DistributionView />     — Role reveal (personal)
  ├── <NightWaitView />        — "La Voyante ouvre les yeux..." (waiting screen)
  ├── <NightActionView />      — Your turn: pick a target (+ timer)
  ├── <WolfVoteView />         — Wolf-specific: real-time vote visibility
  ├── <DayAnnouncementView />  — Night results
  ├── <DayDebateView />        — Synchronized debate timer
  ├── <DayVoteView />          — Simultaneous secret vote
  ├── <HunterView />           — Hunter shoots
  ├── <SpectatorView />        — You are dead, spectating
  ├── <PausedView />           — Game paused (disconnection)
  └── <EndView />              — Final result
```

### New Hooks

| Hook | Purpose |
|---|---|
| `useOnlineGame()` | Main online hook: connects to Realtime channel, listens to public/private messages, maintains local state derived from server broadcasts. Exposes similar interface to `useGame()`. |
| `useChannel()` | Realtime channel abstraction: subscribe, send messages, handle reconnection. |

### New Library

| File | Purpose |
|---|---|
| `lib/supabase.ts` | Supabase client initialization with Anonymous Auth. |

### File Structure

```
app/
  index.tsx                    ← modified: add online buttons
  online/
    create.tsx                 ← Host: config + code/QR
    join.tsx                   ← Enter code / scan QR + name
    lobby.tsx                  ← Waiting room
    game.tsx                   ← Main online game screen

lib/
  supabase.ts                  ← Supabase client init

hooks/
  useOnlineGame.ts             ← Main online state hook
  useChannel.ts                ← Realtime channel abstraction
  useNarrator.ts               ← unchanged (conditioned by isHost)

game/
  roles.ts                     ← unchanged, shared local + server
  nightEngine.ts               ← unchanged, shared local + server
  resolution.ts                ← unchanged, shared local + server
  balance.ts                   ← unchanged, shared local + server

context/
  GameContext.tsx               ← unchanged, local mode only
  MusicContext.tsx              ← unchanged, shared (host uses it in online too)

supabase/
  functions/
    create-game/index.ts
    join-game/index.ts
    leave-game/index.ts
    start-game/index.ts
    night-action/index.ts
    cast-vote/index.ts
    hunter-shoot/index.ts
    reconnect/index.ts
    sync-clock/index.ts
  shared/
    gameLogic.ts               ← re-exports roles, nightEngine, resolution, balance
```

### What Does NOT Change

All existing local code remains intact:
- `app/night.tsx`, `app/day.tsx`, `app/distribution.tsx`, etc. → local mode
- `context/GameContext.tsx` → local mode only
- `context/MusicContext.tsx` → shared
- All existing tests → continue to pass

---

## 11. Join Mechanism — Code + QR

### Code Generation

- 6 uppercase alphanumeric characters (excluding ambiguous: 0/O, 1/I/L)
- Generated server-side by `create-game` Edge Function
- Checked for uniqueness against active games
- Example: `LOUP42`, `MXKR7P`

### QR Code

- Generated client-side from the game code (no server round-trip)
- Contains a deep link: `loupgarou://join?code=LOUP42`
- Displayed on host's create screen alongside the text code
- Scanned via `expo-camera` or `expo-barcode-scanner`

### Join Flow

1. **Via code**: Player opens app → "Rejoindre" → types code → enters name → joins lobby
2. **Via QR**: Player opens app → "Rejoindre" → scans QR → enters name → joins lobby
3. **Via deep link**: Player scans QR with phone camera → app opens directly to join screen with code pre-filled

---

## 12. Supabase Project Setup

### Required Supabase Features

- **Database**: Postgres with the 3 tables defined above
- **Auth**: Anonymous Auth enabled
- **Realtime**: Broadcast enabled on `game:*` channels
- **Edge Functions**: Deno runtime, 9 functions
- **RLS**: Policies as defined in Section 9

### Environment

- **Development**: Supabase local dev (`supabase start`) for testing
- **Production**: Supabase cloud project (free tier sufficient for colleague usage)

### Dependencies to Add

```json
{
  "@supabase/supabase-js": "^2.x",
  "expo-camera": "latest compatible",
  "react-native-qrcode-svg": "latest"
}
```
