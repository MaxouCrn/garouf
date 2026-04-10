# Dev Mode - Accelerated Online Testing

## Problem

Testing the online game requires ~30+ manual steps: creating a game, typing the code on 3 browser tabs, entering names, configuring roles, waiting for ready states. This wastes significant time during development.

## Solution

Add `__DEV__`-gated shortcuts across the existing UI flow. No new screens or routes — just pre-filled fields, auto-actions, and small-group presets. Everything is invisible in production.

## Changes

### 1. `app/online/create.tsx` — Pre-filled host name

- `useState(__DEV__ ? "Host" : "")` for the name field.

### 2. `app/online/join.tsx` — Pre-filled code and auto-name

- Read `code` from URL query params (`useLocalSearchParams`). In dev, pre-fill the code field if present.
- Auto-generate name: `"Bot ${Date.now() % 1000}"` in dev mode.
- Workflow: open browser tab at `/online/join?code=XXXXXX`, tap "Rejoindre".

### 3. `app/online/lobby.tsx` — Auto clipboard + small-group preset

- On mount in dev: copy game code to clipboard via `expo-clipboard`.
- Lower the preset threshold from 6 to 2 players in dev mode.

### 4. `components/online/DistributionView.tsx` — Auto-ready

- Non-host players auto-mark ready after 2 seconds in dev mode.
- Host still flips card manually (already auto-readies on flip).

### 5. `game/balance.ts` — Small-group presets (2-5 players)

Add dev-only presets:
- 2: 1 werewolf, 1 villager
- 3: 1 werewolf, 1 seer, 1 villager
- 4: 1 werewolf, 1 seer, 1 witch, 1 villager
- 5: 2 werewolves, 1 seer, 1 witch, 1 villager

Lower the clamp minimum from 6 to 2 in dev mode.

## Resulting test flow

1. Phone: tap "Creer" (name pre-filled) -> lobby (code auto-copied)
2. 3 browser tabs: paste code in URL `/online/join?code=XXXXXX` -> tap "Rejoindre"
3. Phone: roles auto-configured -> "Lancer la partie"
4. Distribution: flip card, bots auto-ready in 2s -> "Lancer la partie"

## Constraints

- All changes gated behind `__DEV__` (React Native built-in, false in production builds).
- No new files except this spec.
- No server-side changes.
