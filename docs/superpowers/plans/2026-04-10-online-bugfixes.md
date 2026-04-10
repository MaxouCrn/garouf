# Online Mode Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 bugs in online mode so phases play in the same order as local mode, the seer card reveal works, and the vote UI is stable.

**Architecture:** All fixes touch Edge Functions (Deno/Supabase) for server-side logic and React Native components/hooks for client-side rendering. The pattern for phase bugs (intro, resolution, seer) is the same: stop the server from auto-advancing, let the client show UI for N seconds, then the host client sends a follow-up action to advance.

**Tech Stack:** TypeScript, Deno (Edge Functions), React Native, Supabase Realtime

---

### Task 1: Fix daySubPhase not reset to "announcement" (Bug 3)

**Files:**
- Modify: `supabase/functions/night-action/index.ts:459-474`
- Modify: `supabase/functions/hunter-shoot/index.ts:107-119`
- Modify: `hooks/useOnlineGame.ts:122-138`

- [ ] **Step 1: Add `daySubPhase = "announcement"` in night-action resolution**

In `supabase/functions/night-action/index.ts`, before the DB update at line 467, add the reset. Find:

```typescript
      snapshot.nightActions = { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null };
      snapshot.saviorTarget = null;
      snapshot.ravenTarget = snapshot.ravenTarget; // Persist for day vote
```

Replace with:

```typescript
      snapshot.nightActions = { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null };
      snapshot.saviorTarget = null;
      snapshot.ravenTarget = snapshot.ravenTarget; // Persist for day vote
      snapshot.daySubPhase = "announcement";
```

- [ ] **Step 2: Add `daySubPhase = "announcement"` in hunter-shoot**

In `supabase/functions/hunter-shoot/index.ts`, before the DB update at line 112, add:

Find:

```typescript
    snapshot.turn = nextTurn;

    await admin
      .from("games")
      .update({
        phase: nextPhase,
```

Replace with:

```typescript
    snapshot.turn = nextTurn;
    if (nextPhase === "day") {
      snapshot.daySubPhase = "announcement";
    }

    await admin
      .from("games")
      .update({
        phase: nextPhase,
```

- [ ] **Step 3: Reset daySubPhase in client broadcast handler**

In `hooks/useOnlineGame.ts`, in the `"game:phase"` handler, add `daySubPhase` reset. Find:

```typescript
    "game:phase": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GamePhasePayload;
      setState((prev) => ({
        ...prev,
        phase: data.phase as OnlineGameState["phase"],
        turn: data.turn,
        nightStep: data.nightStep ?? null,
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
```

Replace with:

```typescript
    "game:phase": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GamePhasePayload;
      setState((prev) => ({
        ...prev,
        phase: data.phase as OnlineGameState["phase"],
        turn: data.turn,
        nightStep: data.nightStep ?? null,
        actionRequired: null,
        actionResult: null,
        wolfVotes: {},
        littleGirlClue: [],
        voteStatus: null,
        voteResult: null,
        debateTimer: null,
        pauseInfo: null,
        daySubPhase: (data.phase === "day") ? "announcement" : prev.daySubPhase,
      }));
    },
```

- [ ] **Step 4: Deploy and verify**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/night-action/index.ts supabase/functions/hunter-shoot/index.ts hooks/useOnlineGame.ts
git commit -m "fix: reset daySubPhase to announcement when transitioning to day phase"
```

---

### Task 2: Show "Passer au vote" button for host at all times (Bug 5)

**Files:**
- Modify: `components/online/DayDebateView.tsx:38-48`

- [ ] **Step 1: Change button visibility condition**

In `components/online/DayDebateView.tsx`, the current render logic shows the button only when timer is over. Replace the conditional section:

Find:

```typescript
      {!isOver && (
        <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
      )}
      {isOver && isHost && (
        <Pressable style={styles.button} onPress={onStartVote}>
          <Text style={styles.buttonText}>Passer au vote</Text>
        </Pressable>
      )}
      {isOver && !isHost && (
        <Text style={styles.waiting}>En attente du vote...</Text>
      )}
```

Replace with:

```typescript
      {!isOver && !isHost && (
        <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
      )}
      {isHost && (
        <Pressable style={styles.button} onPress={onStartVote}>
          <Text style={styles.buttonText}>Passer au vote</Text>
        </Pressable>
      )}
      {isOver && !isHost && (
        <Text style={styles.waiting}>En attente du vote...</Text>
      )}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add components/online/DayDebateView.tsx
git commit -m "fix: show vote button for host during entire debate phase"
```

---

### Task 3: Stabilize player list during vote (Bug 6)

**Files:**
- Modify: `supabase/functions/reconnect/index.ts:62-65`
- Modify: `components/online/DayVoteView.tsx:1-28`

- [ ] **Step 1: Add ORDER BY to reconnect query**

In `supabase/functions/reconnect/index.ts`, find:

```typescript
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, is_alive")
      .eq("game_id", gameId);
```

Replace with:

```typescript
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, is_alive")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });
```

- [ ] **Step 2: Add useMemo to DayVoteView**

In `components/online/DayVoteView.tsx`, add `useMemo` import and memoize the filtered list. Find:

```typescript
import { useState } from "react";
```

Replace with:

```typescript
import { useState, useMemo } from "react";
```

Then find:

```typescript
  const others = alivePlayers.filter((p) => p.id !== myPlayerId);
```

Replace with:

```typescript
  const others = useMemo(
    () => alivePlayers.filter((p) => p.id !== myPlayerId),
    [alivePlayers.map((p) => p.id).join(","), myPlayerId]
  );
```

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/reconnect/index.ts components/online/DayVoteView.tsx
git commit -m "fix: stabilize player list order during vote with ORDER BY and useMemo"
```

---

### Task 4: Fix night intro phase being skipped (Bug 1)

**Files:**
- Modify: `supabase/functions/start-night/index.ts:88-109`
- Modify: `app/online/game.tsx:170-188`

- [ ] **Step 1: Remove auto-advance in start-night Edge Function**

In `supabase/functions/start-night/index.ts`, the server currently broadcasts intro then immediately advances to the next step. Remove the auto-advance block. Find:

```typescript
    await channel.send({ type: "broadcast", event: "game:phase", payload: { phase: "night", turn, nightStep: "intro" } });
    await channel.send({ type: "broadcast", event: "night:step", payload: { step: "intro" } });

    if (nightSteps.length > 1) {
      const firstRealStep = nightSteps[1];
      snapshot.nightStepIndex = 1;
      snapshot.currentNightStep = firstRealStep;
      await admin.from("games").update({ state_snapshot: snapshot }).eq("id", gameId);
      await channel.send({ type: "broadcast", event: "night:step", payload: { step: firstRealStep } });

      const stepRole = STEP_ROLE_MAP[firstRealStep];
      if (stepRole) {
        const activePlayers = (allPlayers || []).filter((p: any) => p.is_alive && p.role === stepRole);
        const targets = (allPlayers || []).filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name }));
        for (const activePlayer of activePlayers) {
          const actionPayload: any = {
            step: firstRealStep, targets,
            instruction: STEP_INSTRUCTION[firstRealStep] || "",
            timerSeconds: STEP_TIMER[firstRealStep] || 15,
          };
          await channel.send({ type: "broadcast", event: `private:${activePlayer.id}:night:action_required`, payload: actionPayload });
        }
      }
    }
```

Replace with:

```typescript
    await channel.send({ type: "broadcast", event: "game:phase", payload: { phase: "night", turn, nightStep: "intro" } });
    await channel.send({ type: "broadcast", event: "night:step", payload: { step: "intro" } });
```

The `advance_intro` action handler in `night-action/index.ts` already handles advancing from intro to the first real step — it uses the generic advance logic (line 282+) which broadcasts `night:step` and sends `action_required` to active players.

- [ ] **Step 2: Replace manual host button with auto-timer on client**

In `app/online/game.tsx`, replace the intro render block with an auto-advancing version. Find:

```typescript
    // ── Intro phase: "La nuit tombe..." ──
    if (state.nightStep === "intro") {
      return (
        <View style={styles.container}>
          {nightBg}
          <View style={styles.overlay}>
            <View style={styles.centered}>
              <Text style={styles.nightTitle}>La nuit tombe...</Text>
              <Text style={styles.nightSubtitle}>Tout le monde ferme les yeux</Text>
              {isHost && (
                <Pressable style={styles.nightButton} onPress={() => handleNightAction("advance_intro", {})}>
                  <Text style={styles.nightButtonText}>Continuer</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      );
    }
```

Replace with:

```typescript
    // ── Intro phase: "La nuit tombe..." (auto-advance after 4s) ──
    if (state.nightStep === "intro") {
      return (
        <View style={styles.container}>
          {nightBg}
          <View style={styles.overlay}>
            <View style={styles.centered}>
              <Text style={styles.nightTitle}>La nuit tombe...</Text>
              <Text style={styles.nightSubtitle}>Tout le monde ferme les yeux</Text>
              {isHost && <IntroAutoAdvance onAdvance={() => handleNightAction("advance_intro", {})} />}
            </View>
          </View>
        </View>
      );
    }
```

- [ ] **Step 3: Add IntroAutoAdvance component**

At the top of `app/online/game.tsx`, after the imports and before `const SEER_CARD_WIDTH`, add:

Find:

```typescript
const SEER_CARD_WIDTH = 180;
```

Replace with:

```typescript
/** Fires onAdvance once after 4 seconds. Host-only helper. */
function IntroAutoAdvance({ onAdvance }: { onAdvance: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fired.current) { fired.current = true; onAdvance(); }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

const SEER_CARD_WIDTH = 180;
```

- [ ] **Step 4: Verify types**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/start-night/index.ts app/online/game.tsx
git commit -m "fix: display night intro animation for 4s before advancing"
```

---

### Task 5: Fix seer card not showing (Bug 4)

**Files:**
- Modify: `supabase/functions/night-action/index.ts:235-250,282-294`
- Modify: `app/online/game.tsx:80-83,234-260`

- [ ] **Step 1: Prevent server from advancing after seer_inspect**

In `supabase/functions/night-action/index.ts`, the seer action stores the result but then the generic advance code (line 282+) runs and moves to the next step. We need to return early after seer_inspect so the step stays on "seer".

After the seer block (line 250), add an early return. Find:

```typescript
      // Also broadcast privately (best-effort)
      await channel.send({
        type: "broadcast",
        event: `private:${player.id}:night:action_result`,
        payload: { result: seerResult },
      });
    }

    // Handle savior action
```

Replace with:

```typescript
      // Also broadcast privately (best-effort)
      await channel.send({
        type: "broadcast",
        event: `private:${player.id}:night:action_result`,
        payload: { result: seerResult },
      });

      // Do NOT advance step — client will display the card then send "seer_done"
      await admin.from("games").update({ state_snapshot: snapshot }).eq("id", gameId);

      return new Response(
        JSON.stringify({ received: true, nextStep: "seer", seerResult }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle seer_done — advance past seer step after client displayed the card
    if (actionType === "seer_done" && currentStep === "seer") {
      // Fall through to generic advance logic below
    }

    // Handle savior action
```

- [ ] **Step 2: Remove useEffect that resets seerResult on nightStep change**

In `app/online/game.tsx`, find and remove:

```typescript
  // Reset seer result when night step changes
  useEffect(() => {
    setSeerResult(null);
  }, [state.nightStep]);
```

Replace with:

```typescript
```

(Delete entirely — the `seerResult` will be managed by the seer flow itself.)

- [ ] **Step 3: Replace manual "Continuer" button with auto-advance timer**

In `app/online/game.tsx`, update the seer result display to auto-advance after 4s. Find:

```typescript
    // ── Seer result: show card of inspected player ──
    if (state.nightStep === "seer" && state.myRole === "seer" && seerResult) {
      const roleKey = seerResult.role as Role;
      const roleLabel = ROLE_LABELS[roleKey];
      const cardImage = ROLE_CARDS[roleKey];
      return (
        <View style={styles.container}>
          {nightBg}
          <View style={styles.overlay}>
            <View style={styles.centered}>
              <Text style={styles.seerLabel}>Le joueur {seerResult.name} a le role :</Text>
              {cardImage ? (
                <Image source={cardImage} style={styles.seerCard} resizeMode="contain" />
              ) : (
                <View style={styles.seerFallbackCard}>
                  <Text style={styles.seerEmoji}>{roleLabel?.emoji ?? "?"}</Text>
                </View>
              )}
              <Text style={styles.seerRoleName}>{roleLabel?.label ?? seerResult.role}</Text>
              <Pressable style={styles.nightButton} onPress={() => handleNightAction("seer_continue", {})}>
                <Text style={styles.nightButtonText}>Continuer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }
```

Replace with:

```typescript
    // ── Seer result: show card of inspected player (auto-advance after 4s) ──
    if (state.nightStep === "seer" && state.myRole === "seer" && seerResult) {
      const roleKey = seerResult.role as Role;
      const roleLabel = ROLE_LABELS[roleKey];
      const cardImage = ROLE_CARDS[roleKey];
      return (
        <View style={styles.container}>
          {nightBg}
          <View style={styles.overlay}>
            <View style={styles.centered}>
              <Text style={styles.seerLabel}>Le joueur {seerResult.name} a le role :</Text>
              {cardImage ? (
                <Image source={cardImage} style={styles.seerCard} resizeMode="contain" />
              ) : (
                <View style={styles.seerFallbackCard}>
                  <Text style={styles.seerEmoji}>{roleLabel?.emoji ?? "?"}</Text>
                </View>
              )}
              <Text style={styles.seerRoleName}>{roleLabel?.label ?? seerResult.role}</Text>
              <SeerAutoAdvance onAdvance={() => { handleNightAction("seer_done", {}); setSeerResult(null); }} />
            </View>
          </View>
        </View>
      );
    }
```

- [ ] **Step 4: Add SeerAutoAdvance component**

In `app/online/game.tsx`, next to the `IntroAutoAdvance` component added in Task 4, add:

Find:

```typescript
const SEER_CARD_WIDTH = 180;
```

Replace with (keeping `IntroAutoAdvance` already above):

```typescript
/** Fires onAdvance once after 4 seconds. Seer card display helper. */
function SeerAutoAdvance({ onAdvance }: { onAdvance: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fired.current) { fired.current = true; onAdvance(); }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

const SEER_CARD_WIDTH = 180;
```

- [ ] **Step 5: Verify types**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/night-action/index.ts app/online/game.tsx
git commit -m "fix: display seer card for 4s before advancing to next night step"
```

---

### Task 6: Fix night resolution phase being skipped (Bug 2)

**Files:**
- Modify: `supabase/functions/night-action/index.ts:340-497`
- Modify: `app/online/game.tsx:190-208`
- Modify: `hooks/useOnlineGame.ts:151-159`

This is the most complex fix. Currently the server handles the entire resolution (deaths + phase transition) in one shot. We split it into two steps:
1. When the step reaches "resolution": calculate deaths, update DB, but keep `phase: "night"` and broadcast `night:step: "resolution"` with death data.
2. When the host sends `resolve_night`: transition to the next phase (day/hunter/end).

- [ ] **Step 1: Split resolution into "calculate deaths" and "transition" phases**

In `supabase/functions/night-action/index.ts`, replace the entire resolution block. Find:

```typescript
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
      snapshot.daySubPhase = "announcement";

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
```

Replace with:

```typescript
    // Handle resolution step — Phase 1: calculate deaths, stay in night phase
    if (snapshot.currentNightStep === "resolution" && actionType !== "resolve_night") {
      const nightActions = snapshot.nightActions || {};
      const deaths: string[] = [];
      let newElderLives = snapshot.elderLives ?? 2;
      const updatedPotions = { ...(snapshot.witchPotions || { life: true, death: true }) };

      const target = nightActions.werewolvesTarget;

      if (target) {
        let targetSaved = false;

        if (snapshot.saviorTarget === target) {
          targetSaved = true;
        }

        if (!targetSaved) {
          const targetPlayer = (allPlayers || []).find((p: any) => p.id === target);
          if (targetPlayer?.role === "elder" && newElderLives > 1) {
            targetSaved = true;
            newElderLives -= 1;
          }
        }

        if (!targetSaved && nightActions.witchHeal && updatedPotions.life) {
          targetSaved = true;
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
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        for (const deadId of [...deaths]) {
          if (l1 === deadId && !deaths.includes(l2)) {
            deaths.push(l2);
            break;
          } else if (l2 === deadId && !deaths.includes(l1)) {
            deaths.push(l1);
            break;
          }
        }
      }

      // Apply deaths in DB
      for (const deadId of deaths) {
        await admin.from("players").update({ is_alive: false }).eq("id", deadId);
      }

      // Update snapshot with death results but keep phase as "night"
      snapshot.elderLives = newElderLives;
      snapshot.witchPotions = updatedPotions;
      snapshot.lastSaviorTarget = snapshot.saviorTarget;
      snapshot.nightDeaths = deaths;

      await admin.from("games").update({ state_snapshot: snapshot }).eq("id", gameId);

      const deathDetails = deaths.map((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return { id, name: p?.name || "?" };
      });

      // Broadcast resolution step with death info — clients show sunrise animation
      await channel.send({
        type: "broadcast",
        event: "night:step",
        payload: { step: "resolution", nightDeaths: deathDetails },
      });

      const updatedPlayers = (allPlayers || []).map((p: any) => ({
        ...p,
        is_alive: deaths.includes(p.id) ? false : p.is_alive,
      }));
      const aliveDetails = updatedPlayers.filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name }));

      await channel.send({
        type: "broadcast",
        event: "game:state",
        payload: { alivePlayers: aliveDetails, nightDeaths: deathDetails, winner: null },
      });

      return new Response(
        JSON.stringify({ resolved: false, deaths: deathDetails }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle resolution step — Phase 2: host sends resolve_night to transition phase
    if (actionType === "resolve_night" && snapshot.currentNightStep === "resolution") {
      const deaths: string[] = snapshot.nightDeaths || [];

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

      let nextPhase = "day";
      if (winner) nextPhase = "end";
      else if (hunterTriggered) { nextPhase = "hunter"; snapshot.hunterContext = "night"; }

      snapshot.nightActions = { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null };
      snapshot.saviorTarget = null;
      snapshot.ravenTarget = snapshot.ravenTarget; // Persist for day vote
      snapshot.daySubPhase = "announcement";

      await admin.from("games").update({
        phase: nextPhase,
        state_snapshot: snapshot,
        ...(winner ? { status: "finished" } : {}),
      }).eq("id", gameId);

      const deathDetails = (snapshot.nightDeaths || []).map((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return { id, name: p?.name || "?" };
      });
      const aliveDetails = updatedPlayers.filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name }));

      await channel.send({
        type: "broadcast",
        event: "game:state",
        payload: { alivePlayers: aliveDetails, nightDeaths: deathDetails, winner },
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
```

- [ ] **Step 2: Update client resolution render with auto-advance**

In `app/online/game.tsx`, update the resolution render block to auto-advance after 3s. Find:

```typescript
    // ── Resolution phase: "Le soleil se lève..." ──
    if (state.nightStep === "resolution") {
      return (
        <View style={styles.container}>
          {nightBg}
          <View style={styles.overlay}>
            <View style={styles.centered}>
              <Text style={styles.nightTitle}>Le soleil se leve...</Text>
              {isHost && (
                <Pressable style={styles.nightButton} onPress={() => handleNightAction("resolve_night", {})}>
                  <Text style={styles.nightButtonText}>Reveler les evenements</Text>
                </Pressable>
              )}
              {!isHost && <Text style={styles.waitText}>En attente...</Text>}
            </View>
          </View>
        </View>
      );
    }
```

Replace with:

```typescript
    // ── Resolution phase: sunrise animation + deaths (auto-advance after 3s) ──
    if (state.nightStep === "resolution") {
      return (
        <View style={styles.container}>
          {nightBg}
          <View style={styles.overlay}>
            <View style={styles.centered}>
              <Text style={styles.nightTitle}>Le soleil se leve...</Text>
              {isHost && <ResolutionAutoAdvance onAdvance={() => handleNightAction("resolve_night", {})} />}
            </View>
          </View>
        </View>
      );
    }
```

- [ ] **Step 3: Add ResolutionAutoAdvance component**

In `app/online/game.tsx`, next to the other auto-advance components, before `const SEER_CARD_WIDTH`, add:

Find (after IntroAutoAdvance and SeerAutoAdvance from Tasks 4-5):

```typescript
const SEER_CARD_WIDTH = 180;
```

Replace with:

```typescript
/** Fires onAdvance once after 3 seconds (sunrise animation duration). */
function ResolutionAutoAdvance({ onAdvance }: { onAdvance: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fired.current) { fired.current = true; onAdvance(); }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

const SEER_CARD_WIDTH = 180;
```

- [ ] **Step 4: Update nightDeaths in client from resolution broadcast**

In `hooks/useOnlineGame.ts`, the `"night:step"` handler needs to capture `nightDeaths` from the resolution broadcast payload. Find:

```typescript
    "night:step": (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightStepPayload;
      setState((prev) => ({
        ...prev,
        nightStep: data.step,
        actionRequired: null,
        actionResult: null,
      }));
    },
```

Replace with:

```typescript
    "night:step": (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightStepPayload;
      const nightDeaths = (payload as any).nightDeaths;
      setState((prev) => ({
        ...prev,
        nightStep: data.step,
        actionRequired: null,
        actionResult: null,
        ...(nightDeaths ? { nightDeaths } : {}),
      }));
    },
```

- [ ] **Step 5: Verify types**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/night-action/index.ts app/online/game.tsx hooks/useOnlineGame.ts
git commit -m "fix: display resolution sunrise animation for 3s before transitioning to day"
```
