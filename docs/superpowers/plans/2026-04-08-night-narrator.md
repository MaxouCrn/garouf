# Night Narrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a vocal narrator that plays pre-recorded announcements for each night phase, with ambiance music ducking during narration.

**Architecture:** A single `useNarrator` hook manages both the ambiance loop and narrator one-shots using `expo-av`. It ducks the ambiance volume when the narrator plays and restores it when done. The hook replaces all existing sound logic in `night.tsx`.

**Tech Stack:** expo-av (Audio.Sound), React hooks, TypeScript

---

### Task 1: Create `useNarrator` hook with tests

**Files:**
- Create: `hooks/useNarrator.ts`
- Test: `__tests__/useNarrator.test.ts`

- [ ] **Step 1: Write the failing test for narrator sound mapping**

```typescript
// __tests__/useNarrator.test.ts
import { NARRATOR_SOUNDS, AMBIANCE_SOUND } from "../hooks/useNarrator";

describe("useNarrator constants", () => {
  it("maps every NightStep to a narrator sound source", () => {
    const steps = ["intro", "werewolves", "seer", "witch", "resolution"];
    for (const step of steps) {
      expect(NARRATOR_SOUNDS[step]).toBeDefined();
    }
  });

  it("has an ambiance sound source", () => {
    expect(AMBIANCE_SOUND).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/useNarrator.test.ts -v`
Expected: FAIL with "Cannot find module '../hooks/useNarrator'"

- [ ] **Step 3: Write the `useNarrator` hook**

```typescript
// hooks/useNarrator.ts
import { useEffect, useRef, useCallback } from "react";
import { Audio, AVPlaybackSource, AVPlaybackStatus } from "expo-av";

type NightStep = "intro" | "werewolves" | "seer" | "witch" | "resolution";

const AMBIANCE_VOLUME = 0.3;
const DUCKED_VOLUME = 0.05;

export const NARRATOR_SOUNDS: Record<NightStep, AVPlaybackSource> = {
  intro: require("../assets/sounds/narrator/nightfall_phase.mp3"),
  werewolves: require("../assets/sounds/narrator/loup_garou_phase.mp3"),
  seer: require("../assets/sounds/narrator/voyante_phase.mp3"),
  witch: require("../assets/sounds/narrator/sorcer_phase.mp3"),
  resolution: require("../assets/sounds/narrator/morning_phase.mp3"),
};

export const AMBIANCE_SOUND: AVPlaybackSource = require("../assets/sounds/ambiance_music.mp3");

export function useNarrator(nightStep: NightStep): void {
  const ambianceRef = useRef<Audio.Sound | null>(null);
  const narratorRef = useRef<Audio.Sound | null>(null);

  // Start ambiance on mount, stop on unmount
  useEffect(() => {
    let mounted = true;

    async function startAmbiance() {
      try {
        const { sound } = await Audio.Sound.createAsync(AMBIANCE_SOUND, {
          isLooping: true,
          volume: AMBIANCE_VOLUME,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        ambianceRef.current = sound;
        await sound.playAsync();
      } catch {
        // Silently ignore
      }
    }

    startAmbiance();

    return () => {
      mounted = false;
      ambianceRef.current?.stopAsync().then(() => ambianceRef.current?.unloadAsync());
    };
  }, []);

  // Play narrator on nightStep change, duck ambiance
  useEffect(() => {
    let mounted = true;

    async function playNarrator() {
      // Stop previous narrator if still playing
      try {
        if (narratorRef.current) {
          await narratorRef.current.stopAsync();
          await narratorRef.current.unloadAsync();
          narratorRef.current = null;
        }
      } catch {
        // Ignore
      }

      const source = NARRATOR_SOUNDS[nightStep];
      if (!source) return;

      try {
        // Duck ambiance
        await ambianceRef.current?.setVolumeAsync(DUCKED_VOLUME);

        const { sound } = await Audio.Sound.createAsync(source);
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        narratorRef.current = sound;

        // Restore ambiance when narrator finishes
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            ambianceRef.current?.setVolumeAsync(AMBIANCE_VOLUME);
          }
        });

        await sound.playAsync();
      } catch {
        // If narrator fails, restore ambiance volume
        ambianceRef.current?.setVolumeAsync(AMBIANCE_VOLUME);
      }
    }

    playNarrator();

    return () => {
      mounted = false;
    };
  }, [nightStep]);

  // Cleanup narrator on unmount
  useEffect(() => {
    return () => {
      narratorRef.current?.stopAsync().then(() => narratorRef.current?.unloadAsync());
    };
  }, []);
}
```

- [ ] **Step 4: Add jest mock for expo-av and asset requires**

Add to the top of the test file so `require()` calls for `.mp3` don't break Jest:

```typescript
// __tests__/useNarrator.test.ts

// Mock mp3 requires to return a number (metro asset ID)
jest.mock("../assets/sounds/narrator/nightfall_phase.mp3", () => 1, { virtual: true });
jest.mock("../assets/sounds/narrator/loup_garou_phase.mp3", () => 2, { virtual: true });
jest.mock("../assets/sounds/narrator/voyante_phase.mp3", () => 3, { virtual: true });
jest.mock("../assets/sounds/narrator/sorcer_phase.mp3", () => 4, { virtual: true });
jest.mock("../assets/sounds/narrator/morning_phase.mp3", () => 5, { virtual: true });
jest.mock("../assets/sounds/ambiance_music.mp3", () => 6, { virtual: true });

import { NARRATOR_SOUNDS, AMBIANCE_SOUND } from "../hooks/useNarrator";

describe("useNarrator constants", () => {
  it("maps every NightStep to a narrator sound source", () => {
    const steps = ["intro", "werewolves", "seer", "witch", "resolution"] as const;
    for (const step of steps) {
      expect(NARRATOR_SOUNDS[step]).toBeDefined();
    }
  });

  it("has an ambiance sound source", () => {
    expect(AMBIANCE_SOUND).toBeDefined();
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/useNarrator.test.ts -v`
Expected: PASS — both tests green

- [ ] **Step 6: Commit**

```bash
git add hooks/useNarrator.ts __tests__/useNarrator.test.ts
git commit -m "feat: add useNarrator hook with ambiance ducking"
```

---

### Task 2: Integrate `useNarrator` into `night.tsx`

**Files:**
- Modify: `app/night.tsx`

- [ ] **Step 1: Replace sound imports and hooks with `useNarrator`**

In `app/night.tsx`, replace lines 1-44 (imports through sound effects) with:

```typescript
import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { useNarrator } from "../hooks/useNarrator";
import { colors } from "../theme/colors";

const ROLE_LABELS: Record<Role, string> = {
  werewolf: "Loup-Garou",
  villager: "Villageois",
  seer: "Voyante",
  witch: "Sorciere",
  hunter: "Chasseur",
};

export default function NightScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  useNarrator(state.nightStep);

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const aliveNonWolves = alivePlayers.filter((p) => p.role !== "werewolf");

  const handleNextStep = () => {
    dispatch({ type: "NEXT_NIGHT_STEP" });
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_NIGHT" });
  };

  // After RESOLVE_NIGHT, phase changes — navigate via useEffect
  useEffect(() => {
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "day") router.replace("/day");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);
```

Everything from line 64 onward (the JSX return) stays unchanged.

- [ ] **Step 2: Remove the old `useSoundEffect` import**

Verify that `useSoundEffect` and `useLoopingSound` are no longer imported in `night.tsx`. The import line `import { useSoundEffect, useLoopingSound } from "../hooks/useSoundEffect";` should be gone.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run all tests**

Run: `npx jest`
Expected: All tests pass

- [ ] **Step 5: Manual test on device/simulator**

Test on Expo Go or simulator:
1. Start a game, reach night phase
2. Verify ambiance music plays on mount
3. Verify narrator plays on intro step ("La nuit tombe...")
4. Verify ambiance ducks during narration, restores after
5. Advance to werewolves step — narrator cuts and new one starts
6. Advance quickly through steps — no audio glitches
7. Resolve night — ambiance stops

- [ ] **Step 6: Commit**

```bash
git add app/night.tsx
git commit -m "feat: integrate narrator into night screen with ambiance ducking"
```

---

### Task 3: Cleanup old sound assets

**Files:**
- Delete: `assets/sounds/werewolf.mp3` (replaced by narrator files)
- Modify: `hooks/useSoundEffect.ts` (keep file — may be used elsewhere)

- [ ] **Step 1: Check if `werewolf.mp3` or `useSoundEffect` is referenced anywhere else**

Run:
```bash
grep -r "werewolf.mp3" --include="*.ts" --include="*.tsx" .
grep -r "useSoundEffect\|useLoopingSound" --include="*.ts" --include="*.tsx" . | grep -v "hooks/useSoundEffect.ts"
```

If no references remain, delete `werewolf.mp3`. If `useSoundEffect` has no other consumers, delete the hook file too.

- [ ] **Step 2: Delete unused assets/files**

```bash
rm assets/sounds/werewolf.mp3
# Only if no other consumers:
# rm hooks/useSoundEffect.ts
```

- [ ] **Step 3: Run all tests**

Run: `npx jest`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old sound assets replaced by narrator"
```
