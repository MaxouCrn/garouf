# Dev Phase Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dev-only screen that lets developers inject any GameState via JSON editor and navigate to any phase screen for UI/UX work.

**Architecture:** A new `SET_STATE` reducer action replaces the entire GameState. A dev screen (`app/dev.tsx`) lists phase presets, provides a JSON editor, and navigates to the corresponding route after dispatch. Presets live in `game/devPresets.ts`.

**Tech Stack:** React Native, Expo Router, TypeScript, existing GameContext reducer

---

### Task 1: Add SET_STATE action to the reducer

**Files:**
- Modify: `context/GameContext.tsx:102-125` (GameAction type)
- Modify: `context/GameContext.tsx:189` (gameReducer switch)

- [ ] **Step 1: Add SET_STATE to GameAction type**

In `context/GameContext.tsx`, add the new action variant to the union type:

```typescript
export type GameAction =
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "SET_ROLES"; roles: { role: Role; count: number }[] }
  | { type: "SET_TIMER"; minutes: number }
  | { type: "START_DISTRIBUTION" }
  | { type: "REVEAL_ROLE" }
  | { type: "NEXT_PLAYER" }
  | { type: "START_NIGHT" }
  | { type: "SET_WEREWOLF_TARGET"; playerId: string }
  | { type: "SET_SEER_TARGET"; playerId: string }
  | { type: "SET_WITCH_HEAL"; heal: boolean }
  | { type: "SET_WITCH_KILL"; playerId: string | null }
  | { type: "NEXT_NIGHT_STEP" }
  | { type: "RESOLVE_NIGHT" }
  | { type: "START_DAY" }
  | { type: "VOTE_ELIMINATE"; playerId: string }
  | { type: "HUNTER_SHOOT"; playerId: string }
  | { type: "CHECK_WINNER" }
  | { type: "RESET_GAME" }
  | { type: "SET_LOVERS"; player1Id: string; player2Id: string }
  | { type: "SET_SAVIOR_TARGET"; playerId: string }
  | { type: "SET_RAVEN_TARGET"; playerId: string | null }
  | { type: "SET_LITTLE_GIRL_CLUE"; clue: string[] }
  | { type: "SET_STATE"; payload: GameState };
```

- [ ] **Step 2: Add SET_STATE case to gameReducer**

Add the case at the end of the switch statement in `gameReducer`, before the default:

```typescript
    case "SET_STATE": {
      if (__DEV__) return action.payload;
      return state;
    }
```

- [ ] **Step 3: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run existing tests**

Run: `npx jest`
Expected: All existing tests pass (no regressions)

- [ ] **Step 5: Commit**

```bash
git add context/GameContext.tsx
git commit -m "feat: add SET_STATE dev-only action to game reducer"
```

---

### Task 2: Create dev presets

**Files:**
- Create: `game/devPresets.ts`

- [ ] **Step 1: Create `game/devPresets.ts` with all presets**

```typescript
import { GameState, Player } from "../context/GameContext";
import { Role } from "./roles";
import { NightStep, buildNightSteps } from "./nightEngine";

function makePlayers(
  configs: { name: string; role: Role | null; isAlive: boolean }[]
): Player[] {
  return configs.map((c, i) => ({
    id: String(i + 1),
    name: c.name,
    role: c.role,
    isAlive: c.isAlive,
  }));
}

const basePlayers: { name: string; role: Role | null; isAlive: boolean }[] = [
  { name: "Alice", role: null, isAlive: true },
  { name: "Bob", role: null, isAlive: true },
  { name: "Claire", role: null, isAlive: true },
  { name: "David", role: null, isAlive: true },
  { name: "Emma", role: null, isAlive: true },
  { name: "Fabien", role: null, isAlive: true },
];

const assignedPlayers: { name: string; role: Role; isAlive: boolean }[] = [
  { name: "Alice", role: "werewolf", isAlive: true },
  { name: "Bob", role: "werewolf", isAlive: true },
  { name: "Claire", role: "seer", isAlive: true },
  { name: "David", role: "witch", isAlive: true },
  { name: "Emma", role: "hunter", isAlive: true },
  { name: "Fabien", role: "villager", isAlive: true },
];

const selectedRoles: { role: Role; count: number }[] = [
  { role: "werewolf", count: 2 },
  { role: "seer", count: 1 },
  { role: "witch", count: 1 },
  { role: "hunter", count: 1 },
  { role: "villager", count: 1 },
];

const baseState: GameState = {
  players: [],
  phase: "setup_players",
  turn: 0,
  nightStep: "intro",
  nightActions: {
    werewolvesTarget: null,
    seerTarget: null,
    witchHeal: false,
    witchKill: null,
  },
  witchPotions: { life: true, death: true },
  winner: null,
  debateTimerMinutes: 5,
  selectedRoles: [],
  distributionIndex: 0,
  revealedRole: false,
  nightDeaths: [],
  hunterContext: null,
  lovers: null,
  saviorTarget: null,
  lastSaviorTarget: null,
  elderLives: 2,
  ravenTarget: null,
  littleGirlClue: null,
  villageIdiotRevealed: false,
  isFirstNight: true,
  elderKilledByVillage: false,
  nightSteps: [],
  nightStepIndex: 0,
};

const nightPlayers = assignedPlayers.map((p, i) =>
  i === 5 ? { ...p, isAlive: false } : p
);
const nightSteps = buildNightSteps(
  makePlayers(nightPlayers),
  false,
  2,
  false
);

const dayPlayers = assignedPlayers.map((p, i) =>
  i === 0 || i === 5 ? { ...p, isAlive: false } : p
);

const endPlayers = assignedPlayers.map((p) =>
  p.role === "werewolf" ? { ...p, isAlive: false } : p
);

export const DEV_PRESETS: Record<string, { label: string; state: GameState }> = {
  setup_players: {
    label: "Setup Joueurs",
    state: {
      ...baseState,
      phase: "setup_players",
      players: makePlayers(basePlayers),
    },
  },
  setup_roles: {
    label: "Setup Roles",
    state: {
      ...baseState,
      phase: "setup_roles",
      players: makePlayers(basePlayers),
      selectedRoles,
    },
  },
  distribution: {
    label: "Distribution",
    state: {
      ...baseState,
      phase: "distribution",
      players: makePlayers(assignedPlayers),
      selectedRoles,
      distributionIndex: 0,
      revealedRole: false,
    },
  },
  night: {
    label: "Nuit",
    state: {
      ...baseState,
      phase: "night",
      turn: 2,
      isFirstNight: false,
      players: makePlayers(nightPlayers),
      selectedRoles,
      nightStep: nightSteps[0],
      nightSteps,
      nightStepIndex: 0,
    },
  },
  day: {
    label: "Jour",
    state: {
      ...baseState,
      phase: "day",
      turn: 2,
      isFirstNight: false,
      players: makePlayers(dayPlayers),
      selectedRoles,
      nightDeaths: ["Fabien"],
      debateTimerMinutes: 3,
    },
  },
  hunter: {
    label: "Chasseur",
    state: {
      ...baseState,
      phase: "hunter",
      turn: 2,
      isFirstNight: false,
      players: makePlayers(
        assignedPlayers.map((p) =>
          p.role === "hunter" ? { ...p, isAlive: false } : p
        )
      ),
      selectedRoles,
      hunterContext: "day",
    },
  },
  end: {
    label: "Fin de partie",
    state: {
      ...baseState,
      phase: "end",
      turn: 4,
      isFirstNight: false,
      players: makePlayers(endPlayers),
      selectedRoles,
      winner: "villagers",
    },
  },
  online_lobby: {
    label: "Online: Lobby",
    state: {
      ...baseState,
      phase: "setup_roles",
      players: makePlayers(basePlayers),
      selectedRoles,
    },
  },
  online_distribution: {
    label: "Online: Distribution",
    state: {
      ...baseState,
      phase: "distribution",
      players: makePlayers(assignedPlayers),
      selectedRoles,
      distributionIndex: 0,
    },
  },
  online_game: {
    label: "Online: Partie",
    state: {
      ...baseState,
      phase: "night",
      turn: 2,
      isFirstNight: false,
      players: makePlayers(nightPlayers),
      selectedRoles,
      nightStep: nightSteps[0],
      nightSteps,
      nightStepIndex: 0,
    },
  },
};

export const PHASE_ROUTE_MAP: Record<string, string> = {
  setup_players: "/players-setup",
  setup_roles: "/roles-setup",
  distribution: "/distribution",
  night: "/night",
  day: "/day",
  hunter: "/hunter",
  end: "/end",
};

export const ONLINE_ROUTE_MAP: Record<string, string> = {
  online_lobby: "/online/lobby",
  online_distribution: "/online/game",
  online_game: "/online/game",
};
```

- [ ] **Step 2: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add game/devPresets.ts
git commit -m "feat: add dev presets for all game phases"
```

---

### Task 3: Create the Dev Tools screen

**Files:**
- Create: `app/dev.tsx`

- [ ] **Step 1: Create `app/dev.tsx`**

```typescript
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useGame, GameState } from "../context/GameContext";
import {
  DEV_PRESETS,
  PHASE_ROUTE_MAP,
  ONLINE_ROUTE_MAP,
} from "../game/devPresets";
import { colors } from "../theme/colors";

export default function DevScreen() {
  const router = useRouter();
  const { dispatch } = useGame();
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const loadPreset = (key: string) => {
    const preset = DEV_PRESETS[key];
    setJson(JSON.stringify(preset.state, null, 2));
    setError(null);
    setActivePreset(key);
  };

  const launch = () => {
    let parsed: GameState;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setError("JSON invalide: " + (e as Error).message);
      return;
    }

    if (!parsed.phase) {
      setError("Le state doit contenir un champ 'phase'");
      return;
    }

    dispatch({ type: "SET_STATE", payload: parsed });

    // Determine route
    let route: string | undefined;
    if (activePreset && ONLINE_ROUTE_MAP[activePreset]) {
      route = ONLINE_ROUTE_MAP[activePreset];
    } else {
      route = PHASE_ROUTE_MAP[parsed.phase];
    }

    if (!route) {
      setError("Phase inconnue: " + parsed.phase);
      return;
    }

    router.replace(route as any);
  };

  const localPresets = Object.entries(DEV_PRESETS).filter(
    ([key]) => !key.startsWith("online_")
  );
  const onlinePresets = Object.entries(DEV_PRESETS).filter(([key]) =>
    key.startsWith("online_")
  );

  const isValid = (() => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dev Tools</Text>
      <Text style={styles.sectionTitle}>Local</Text>
      <View style={styles.presetRow}>
        {localPresets.map(([key, { label }]) => (
          <Pressable
            key={key}
            style={[
              styles.presetButton,
              activePreset === key && styles.presetButtonActive,
            ]}
            onPress={() => loadPreset(key)}
          >
            <Text
              style={[
                styles.presetText,
                activePreset === key && styles.presetTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Online</Text>
      <View style={styles.presetRow}>
        {onlinePresets.map(([key, { label }]) => (
          <Pressable
            key={key}
            style={[
              styles.presetButton,
              activePreset === key && styles.presetButtonActive,
            ]}
            onPress={() => loadPreset(key)}
          >
            <Text
              style={[
                styles.presetText,
                activePreset === key && styles.presetTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>State JSON</Text>
      <TextInput
        style={styles.editor}
        value={json}
        onChangeText={(text) => {
          setJson(text);
          setError(null);
          setActivePreset(null);
        }}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.launchButton, !isValid && styles.launchButtonDisabled]}
        onPress={launch}
        disabled={!isValid}
      >
        <Text style={styles.launchText}>Lancer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
  },
  presetText: {
    color: colors.primary,
    fontSize: 14,
  },
  presetTextActive: {
    color: colors.black,
  },
  editor: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 12,
    borderRadius: 8,
    padding: 12,
    minHeight: 300,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  error: {
    color: colors.danger,
    marginTop: 8,
    fontSize: 14,
  },
  launchButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 40,
  },
  launchButtonDisabled: {
    opacity: 0.4,
  },
  launchText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/dev.tsx
git commit -m "feat: add dev tools screen with JSON editor and phase presets"
```

---

### Task 4: Wire up routing and home screen button

**Files:**
- Modify: `app/_layout.tsx:44-47` (add dev route to Stack)
- Modify: `app/index.tsx:46-57` (add Dev Tools button)

- [ ] **Step 1: Add dev route to Stack in `app/_layout.tsx`**

Add the `<Stack.Screen>` entry after the existing screens:

```typescript
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="online" options={{ headerShown: false }} />
        <Stack.Screen name="dev" options={{ headerShown: false }} />
```

- [ ] **Step 2: Add Dev Tools button to `app/index.tsx`**

Add the button conditionally at the end of the JSX, after the "Rejoindre une partie" Pressable (before the closing `</ImageBackground>`):

```typescript
      {__DEV__ && (
        <Pressable
          style={[styles.outlineButton, { marginTop: 32, borderColor: colors.danger }]}
          onPress={() => router.push("/dev")}
        >
          <Text style={[styles.outlineButtonText, { color: colors.danger }]}>
            Dev Tools
          </Text>
        </Pressable>
      )}
```

- [ ] **Step 3: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manual test**

Run: `npx expo start`
Expected:
1. Home screen shows red "Dev Tools" button at the bottom
2. Tapping it navigates to the dev screen
3. Tapping a preset fills the JSON editor
4. Tapping "Lancer" injects the state and navigates to the correct phase screen
5. The phase screen renders with the mock data

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx app/index.tsx
git commit -m "feat: wire dev tools button on home screen and add route"
```
