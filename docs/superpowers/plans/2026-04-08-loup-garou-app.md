# Loup-Garou Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile Werewolf (Loup-Garou) game master app using React Native + Expo, where a single phone orchestrates the game phases and players pass it around to see their roles.

**Architecture:** Single-phone app with no backend. All game state lives in a React Context + useReducer. expo-router handles file-based navigation between screens. The game reducer contains all game logic (role assignment, night resolution, victory checks).

**Tech Stack:** React Native, Expo (managed), TypeScript, expo-router, React Context + useReducer

---

## File Structure

```
loup_garou/
├── app/
│   ├── _layout.tsx              # Root layout, wraps app in GameProvider
│   ├── index.tsx                # HomeScreen — "Nouvelle partie"
│   ├── players-setup.tsx        # PlayersSetupScreen — add/remove players
│   ├── roles-setup.tsx          # RolesSetupScreen — pick roles + timer
│   ├── distribution.tsx         # DistributionScreen — reveal roles one by one
│   ├── night.tsx                # NightScreen — night phase steps
│   ├── day.tsx                  # DayScreen — deaths, debate timer, vote
│   ├── hunter.tsx               # HunterScreen — hunter's last shot
│   └── end.tsx                  # EndScreen — winner + role recap
├── context/
│   └── GameContext.tsx           # GameState types, reducer, context, provider
├── theme/
│   └── colors.ts                # Dark theme color palette
├── __tests__/
│   └── gameReducer.test.ts      # Unit tests for game reducer logic
├── app.json                     # Expo config
├── tsconfig.json                # TypeScript config
└── package.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `app/`, `context/`, `theme/`, `__tests__/` directories (via create-expo-app + manual)
- Modify: `app.json`, `package.json`, `tsconfig.json`

- [ ] **Step 1: Create Expo project**

Run from the **parent directory** (`/Users/maximecaron/Dev_perso/`):

```bash
cd /Users/maximecaron/Dev_perso/loup_garou
npx create-expo-app@latest . --template blank-typescript
```

If prompted about the existing directory, confirm yes. This scaffolds the project with TypeScript support.

- [ ] **Step 2: Install expo-router dependencies**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

- [ ] **Step 3: Configure expo-router in app.json**

Replace the content of `app.json` with:

```json
{
  "expo": {
    "name": "Loup Garou",
    "slug": "loup-garou",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "scheme": "loup-garou",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      }
    },
    "plugins": ["expo-router"]
  }
}
```

- [ ] **Step 4: Set entry point in package.json**

Add to `package.json`:

```json
{
  "main": "expo-router/entry"
}
```

- [ ] **Step 5: Create supporting directories**

```bash
mkdir -p context theme __tests__
```

- [ ] **Step 6: Install test dependencies**

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest ts-jest
```

- [ ] **Step 7: Verify the app starts**

```bash
npx expo start
```

Scan the QR code with Expo Go to confirm a blank screen loads. Press `Ctrl+C` to stop.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with expo-router and TypeScript"
```

---

### Task 2: Theme Colors

**Files:**
- Create: `theme/colors.ts`

- [ ] **Step 1: Create the dark theme color palette**

Create `theme/colors.ts`:

```typescript
export const colors = {
  background: "#1a1a2e",
  surface: "#16213e",
  surfaceLight: "#0f3460",
  primary: "#e94560",
  primaryLight: "#ff6b6b",
  text: "#eee",
  textSecondary: "#aaa",
  textMuted: "#666",
  success: "#4ecca3",
  danger: "#e94560",
  warning: "#f0a500",
  white: "#fff",
  black: "#000",
  overlay: "rgba(0,0,0,0.7)",
};
```

- [ ] **Step 2: Commit**

```bash
git add theme/colors.ts
git commit -m "feat: add dark theme color palette"
```

---

### Task 3: Game State Types & Reducer (TDD)

**Files:**
- Create: `context/GameContext.tsx`
- Create: `__tests__/gameReducer.test.ts`

This is the core of the app. We build it test-first.

- [ ] **Step 1: Write types and initial state**

Create `context/GameContext.tsx`:

```typescript
import React, { createContext, useContext, useReducer, ReactNode } from "react";

// --- Types ---

export type Role = "werewolf" | "villager" | "seer" | "witch" | "hunter";

export interface Player {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
}

export type GamePhase =
  | "setup_players"
  | "setup_roles"
  | "distribution"
  | "night"
  | "day"
  | "hunter"
  | "end";

export type NightStep =
  | "intro"
  | "werewolves"
  | "seer"
  | "witch"
  | "resolution";

export interface NightActions {
  werewolvesTarget: string | null;
  seerTarget: string | null;
  witchHeal: boolean;
  witchKill: string | null;
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  turn: number;
  nightStep: NightStep;
  nightActions: NightActions;
  witchPotions: { life: boolean; death: boolean };
  winner: "werewolves" | "villagers" | null;
  debateTimerMinutes: number;
  selectedRoles: { role: Role; count: number }[];
  distributionIndex: number;
  revealedRole: boolean;
  nightDeaths: string[];
  hunterContext: "night" | "day" | null;
}

const emptyNightActions: NightActions = {
  werewolvesTarget: null,
  seerTarget: null,
  witchHeal: false,
  witchKill: null,
};

export const initialState: GameState = {
  players: [],
  phase: "setup_players",
  turn: 0,
  nightStep: "intro",
  nightActions: { ...emptyNightActions },
  witchPotions: { life: true, death: true },
  winner: null,
  debateTimerMinutes: 5,
  selectedRoles: [],
  distributionIndex: 0,
  revealedRole: false,
  nightDeaths: [],
  hunterContext: null,
};

// --- Actions ---

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
  | { type: "RESET_GAME" };

// --- Helper functions ---

export function checkWinner(
  players: Player[]
): "werewolves" | "villagers" | null {
  const aliveWolves = players.filter(
    (p) => p.isAlive && p.role === "werewolf"
  ).length;
  const aliveVillagers = players.filter(
    (p) => p.isAlive && p.role !== "werewolf"
  ).length;

  if (aliveWolves === 0) return "villagers";
  if (aliveWolves >= aliveVillagers) return "werewolves";
  return null;
}

export function assignRoles(
  players: Player[],
  selectedRoles: { role: Role; count: number }[]
): Player[] {
  const rolePool: Role[] = [];
  for (const { role, count } of selectedRoles) {
    for (let i = 0; i < count; i++) {
      rolePool.push(role);
    }
  }

  // Shuffle using Fisher-Yates
  const shuffled = [...rolePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return players.map((p, idx) => ({ ...p, role: shuffled[idx] }));
}

export function getNextNightStep(
  currentStep: NightStep,
  players: Player[]
): NightStep | null {
  const steps: NightStep[] = ["intro", "werewolves", "seer", "witch", "resolution"];
  const currentIndex = steps.indexOf(currentStep);

  for (let i = currentIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (step === "intro" || step === "werewolves" || step === "resolution") return step;
    if (step === "seer" && players.some((p) => p.role === "seer" && p.isAlive)) return step;
    if (step === "witch" && players.some((p) => p.role === "witch" && p.isAlive)) return step;
  }
  return null;
}

// --- Reducer ---

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADD_PLAYER": {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: action.name.trim(),
        role: null,
        isAlive: true,
      };
      return { ...state, players: [...state.players, newPlayer] };
    }

    case "REMOVE_PLAYER":
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
      };

    case "SET_ROLES":
      return { ...state, selectedRoles: action.roles };

    case "SET_TIMER":
      return { ...state, debateTimerMinutes: action.minutes };

    case "START_DISTRIBUTION": {
      const assigned = assignRoles(state.players, state.selectedRoles);
      return {
        ...state,
        players: assigned,
        phase: "distribution",
        distributionIndex: 0,
        revealedRole: false,
      };
    }

    case "REVEAL_ROLE":
      return { ...state, revealedRole: true };

    case "NEXT_PLAYER": {
      const nextIndex = state.distributionIndex + 1;
      if (nextIndex >= state.players.length) {
        return { ...state, phase: "night", nightStep: "intro", turn: 1 };
      }
      return {
        ...state,
        distributionIndex: nextIndex,
        revealedRole: false,
      };
    }

    case "START_NIGHT":
      return {
        ...state,
        phase: "night",
        nightStep: "intro",
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
      };

    case "SET_WEREWOLF_TARGET":
      return {
        ...state,
        nightActions: { ...state.nightActions, werewolvesTarget: action.playerId },
      };

    case "SET_SEER_TARGET":
      return {
        ...state,
        nightActions: { ...state.nightActions, seerTarget: action.playerId },
      };

    case "SET_WITCH_HEAL":
      return {
        ...state,
        nightActions: { ...state.nightActions, witchHeal: action.heal },
      };

    case "SET_WITCH_KILL":
      return {
        ...state,
        nightActions: { ...state.nightActions, witchKill: action.playerId },
      };

    case "NEXT_NIGHT_STEP": {
      const nextStep = getNextNightStep(state.nightStep, state.players);
      if (nextStep === null) return state;
      return { ...state, nightStep: nextStep };
    }

    case "RESOLVE_NIGHT": {
      const deaths: string[] = [];
      let updatedPlayers = [...state.players];
      let updatedPotions = { ...state.witchPotions };

      // Werewolf kill (unless healed by witch)
      if (state.nightActions.werewolvesTarget) {
        if (state.nightActions.witchHeal) {
          updatedPotions.life = false;
        } else {
          deaths.push(state.nightActions.werewolvesTarget);
        }
      }

      // Witch poison
      if (state.nightActions.witchKill) {
        deaths.push(state.nightActions.witchKill);
        updatedPotions.death = false;
      }

      // Apply deaths
      updatedPlayers = updatedPlayers.map((p) =>
        deaths.includes(p.id) ? { ...p, isAlive: false } : p
      );

      // Check if hunter died
      const hunterDied = deaths.some(
        (id) => state.players.find((p) => p.id === id)?.role === "hunter"
      );

      const winner = checkWinner(updatedPlayers);

      if (hunterDied && !winner) {
        return {
          ...state,
          players: updatedPlayers,
          witchPotions: updatedPotions,
          nightDeaths: deaths,
          phase: "hunter",
          hunterContext: "night",
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        witchPotions: updatedPotions,
        nightDeaths: deaths,
        phase: winner ? "end" : "day",
        winner,
      };
    }

    case "START_DAY":
      return { ...state, phase: "day" };

    case "VOTE_ELIMINATE": {
      const updatedPlayers = state.players.map((p) =>
        p.id === action.playerId ? { ...p, isAlive: false } : p
      );

      const eliminated = state.players.find((p) => p.id === action.playerId);
      const hunterDied = eliminated?.role === "hunter";

      const winner = checkWinner(updatedPlayers);

      if (hunterDied && !winner) {
        return {
          ...state,
          players: updatedPlayers,
          phase: "hunter",
          hunterContext: "day",
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        phase: winner ? "end" : "night",
        nightStep: "intro",
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
        turn: winner ? state.turn : state.turn + 1,
        winner,
      };
    }

    case "HUNTER_SHOOT": {
      const updatedPlayers = state.players.map((p) =>
        p.id === action.playerId ? { ...p, isAlive: false } : p
      );

      const winner = checkWinner(updatedPlayers);

      if (winner) {
        return { ...state, players: updatedPlayers, phase: "end", winner };
      }

      if (state.hunterContext === "night") {
        return {
          ...state,
          players: updatedPlayers,
          phase: "day",
          hunterContext: null,
        };
      }

      // hunterContext === "day" → go to night
      return {
        ...state,
        players: updatedPlayers,
        phase: "night",
        nightStep: "intro",
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
        turn: state.turn + 1,
        hunterContext: null,
      };
    }

    case "CHECK_WINNER": {
      const winner = checkWinner(state.players);
      if (winner) {
        return { ...state, phase: "end", winner };
      }
      return state;
    }

    case "RESET_GAME":
      return { ...initialState };

    default:
      return state;
  }
}

// --- Context ---

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
```

- [ ] **Step 2: Write failing tests for checkWinner**

Create `__tests__/gameReducer.test.ts`:

```typescript
import {
  checkWinner,
  gameReducer,
  initialState,
  GameState,
  Player,
  getNextNightStep,
} from "../context/GameContext";

function makePlayer(
  id: string,
  name: string,
  role: "werewolf" | "villager" | "seer" | "witch" | "hunter",
  isAlive = true
): Player {
  return { id, name, role, isAlive };
}

describe("checkWinner", () => {
  it("returns 'villagers' when all werewolves are dead", () => {
    const players: Player[] = [
      makePlayer("1", "Alice", "werewolf", false),
      makePlayer("2", "Bob", "villager", true),
      makePlayer("3", "Charlie", "seer", true),
    ];
    expect(checkWinner(players)).toBe("villagers");
  });

  it("returns 'werewolves' when wolves >= villagers", () => {
    const players: Player[] = [
      makePlayer("1", "Alice", "werewolf", true),
      makePlayer("2", "Bob", "villager", true),
      makePlayer("3", "Charlie", "seer", false),
    ];
    expect(checkWinner(players)).toBe("werewolves");
  });

  it("returns null when game is still ongoing", () => {
    const players: Player[] = [
      makePlayer("1", "Alice", "werewolf", true),
      makePlayer("2", "Bob", "villager", true),
      makePlayer("3", "Charlie", "seer", true),
    ];
    expect(checkWinner(players)).toBeNull();
  });
});

describe("getNextNightStep", () => {
  const playersWithAll: Player[] = [
    makePlayer("1", "A", "werewolf", true),
    makePlayer("2", "B", "seer", true),
    makePlayer("3", "C", "witch", true),
    makePlayer("4", "D", "villager", true),
  ];

  it("goes from intro to werewolves", () => {
    expect(getNextNightStep("intro", playersWithAll)).toBe("werewolves");
  });

  it("goes from werewolves to seer when seer is alive", () => {
    expect(getNextNightStep("werewolves", playersWithAll)).toBe("seer");
  });

  it("skips seer when seer is dead", () => {
    const players = playersWithAll.map((p) =>
      p.role === "seer" ? { ...p, isAlive: false } : p
    );
    expect(getNextNightStep("werewolves", players)).toBe("witch");
  });

  it("skips witch when witch is dead", () => {
    const players = playersWithAll.map((p) =>
      p.role === "witch" ? { ...p, isAlive: false } : p
    );
    expect(getNextNightStep("seer", players)).toBe("resolution");
  });
});

describe("gameReducer", () => {
  describe("ADD_PLAYER", () => {
    it("adds a player to the list", () => {
      const state = gameReducer(initialState, {
        type: "ADD_PLAYER",
        name: "Alice",
      });
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe("Alice");
      expect(state.players[0].isAlive).toBe(true);
      expect(state.players[0].role).toBeNull();
    });
  });

  describe("REMOVE_PLAYER", () => {
    it("removes a player by id", () => {
      let state = gameReducer(initialState, {
        type: "ADD_PLAYER",
        name: "Alice",
      });
      const id = state.players[0].id;
      state = gameReducer(state, { type: "REMOVE_PLAYER", id });
      expect(state.players).toHaveLength(0);
    });
  });

  describe("SET_TIMER", () => {
    it("sets the debate timer", () => {
      const state = gameReducer(initialState, {
        type: "SET_TIMER",
        minutes: 3,
      });
      expect(state.debateTimerMinutes).toBe(3);
    });
  });

  describe("RESOLVE_NIGHT", () => {
    it("kills werewolf target when witch does not heal", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Victim", "villager", true),
          makePlayer("3", "Other", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.nightDeaths).toContain("2");
    });

    it("saves werewolf target when witch heals", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Victim", "villager", true),
          makePlayer("3", "Other", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: true,
          witchKill: null,
        },
        witchPotions: { life: true, death: true },
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.witchPotions.life).toBe(false);
    });

    it("witch can poison a player", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Victim", "villager", true),
          makePlayer("3", "Poisoned", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: "3",
        },
        witchPotions: { life: true, death: true },
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.players.find((p) => p.id === "3")?.isAlive).toBe(false);
      expect(result.witchPotions.death).toBe(false);
    });

    it("triggers hunter screen when hunter is killed at night", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", true),
          makePlayer("3", "Other", "villager", true),
          makePlayer("4", "Other2", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.phase).toBe("hunter");
      expect(result.hunterContext).toBe("night");
    });
  });

  describe("VOTE_ELIMINATE", () => {
    it("eliminates voted player and checks victory", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Villager", "villager", true),
          makePlayer("3", "Other", "villager", true),
        ],
        phase: "day",
        turn: 1,
      };

      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "1",
      });
      expect(result.players.find((p) => p.id === "1")?.isAlive).toBe(false);
      expect(result.winner).toBe("villagers");
      expect(result.phase).toBe("end");
    });

    it("triggers hunter when hunter is voted out", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", true),
          makePlayer("3", "V1", "villager", true),
          makePlayer("4", "V2", "villager", true),
        ],
        phase: "day",
        turn: 1,
      };

      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "2",
      });
      expect(result.phase).toBe("hunter");
      expect(result.hunterContext).toBe("day");
    });
  });

  describe("HUNTER_SHOOT", () => {
    it("hunter kills target and checks victory", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "V1", "villager", true),
        ],
        phase: "hunter",
        hunterContext: "day",
        turn: 1,
      };

      const result = gameReducer(state, {
        type: "HUNTER_SHOOT",
        playerId: "1",
      });
      expect(result.players.find((p) => p.id === "1")?.isAlive).toBe(false);
      expect(result.winner).toBe("villagers");
      expect(result.phase).toBe("end");
    });

    it("continues to day after night hunter shoot if no winner", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "V1", "villager", true),
          makePlayer("4", "V2", "villager", true),
        ],
        phase: "hunter",
        hunterContext: "night",
        turn: 1,
      };

      const result = gameReducer(state, {
        type: "HUNTER_SHOOT",
        playerId: "3",
      });
      expect(result.phase).toBe("day");
      expect(result.hunterContext).toBeNull();
    });
  });

  describe("RESET_GAME", () => {
    it("resets to initial state", () => {
      const modifiedState: GameState = {
        ...initialState,
        players: [makePlayer("1", "A", "werewolf")],
        phase: "night",
        turn: 3,
      };
      const result = gameReducer(modifiedState, { type: "RESET_GAME" });
      expect(result).toEqual(initialState);
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npx jest --config='{"preset":"ts-jest","testEnvironment":"node"}' __tests__/gameReducer.test.ts
```

Expected: All tests PASS (the implementation is already in GameContext.tsx).

- [ ] **Step 4: Commit**

```bash
git add context/GameContext.tsx __tests__/gameReducer.test.ts
git commit -m "feat: add game state types, reducer with full game logic, and tests"
```

---

### Task 4: Root Layout

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create root layout wrapping app in GameProvider**

Create `app/_layout.tsx`:

```typescript
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "../context/GameContext";
import { colors } from "../theme/colors";

export default function RootLayout() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
    </GameProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add root layout with GameProvider and dark theme"
```

---

### Task 5: HomeScreen

**Files:**
- Create: `app/index.tsx`

- [ ] **Step 1: Create the home screen**

Create `app/index.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useGame();

  const handleNewGame = () => {
    dispatch({ type: "RESET_GAME" });
    router.push("/players-setup");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🐺</Text>
      <Text style={styles.title}>Loup-Garou</Text>
      <Text style={styles.subtitle}>Le jeu de la pause midi</Text>
      <Pressable style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Verify in Expo Go**

```bash
npx expo start
```

Scan QR code. Verify: dark screen with wolf emoji, "Loup-Garou" title, "Nouvelle partie" button. Press `Ctrl+C` to stop.

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add home screen with new game button"
```

---

### Task 6: PlayersSetupScreen

**Files:**
- Create: `app/players-setup.tsx`

- [ ] **Step 1: Create the players setup screen**

Create `app/players-setup.tsx`:

```typescript
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

const MIN_PLAYERS = 4;

export default function PlayersSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [name, setName] = useState("");

  const addPlayer = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    dispatch({ type: "ADD_PLAYER", name: trimmed });
    setName("");
  };

  const canProceed = state.players.length >= MIN_PLAYERS;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Joueurs" }} />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nom du joueur"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          onSubmitEditing={addPlayer}
          autoFocus
        />
        <Pressable
          style={[styles.addButton, !name.trim() && styles.buttonDisabled]}
          onPress={addPlayer}
          disabled={!name.trim()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.count}>
        {state.players.length} joueur{state.players.length !== 1 ? "s" : ""}{" "}
        {state.players.length < MIN_PLAYERS
          ? `(min. ${MIN_PLAYERS})`
          : ""}
      </Text>

      <FlatList
        data={state.players}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>
              {index + 1}. {item.name}
            </Text>
            <Pressable
              onPress={() =>
                dispatch({ type: "REMOVE_PLAYER", id: item.id })
              }
            >
              <Text style={styles.removeButton}>✕</Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable
        style={[styles.nextButton, !canProceed && styles.buttonDisabled]}
        onPress={() => router.push("/roles-setup")}
        disabled={!canProceed}
      >
        <Text style={styles.nextButtonText}>Suivant</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    padding: 14,
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  removeButton: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: 8,
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Verify in Expo Go**

Open the app, tap "Nouvelle partie". Verify: text input to add players, can add/remove, "Suivant" disabled until 4+ players.

- [ ] **Step 3: Commit**

```bash
git add app/players-setup.tsx
git commit -m "feat: add players setup screen with add/remove functionality"
```

---

### Task 7: RolesSetupScreen

**Files:**
- Create: `app/roles-setup.tsx`

- [ ] **Step 1: Create the roles setup screen**

Create `app/roles-setup.tsx`:

```typescript
import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";

interface RoleConfig {
  role: Role;
  label: string;
  emoji: string;
  description: string;
  min: number;
  max: number;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: "werewolf",
    label: "Loup-Garou",
    emoji: "🐺",
    description: "Se reveille la nuit pour eliminer un villageois",
    min: 1,
    max: 4,
  },
  {
    role: "seer",
    label: "Voyante",
    emoji: "🔮",
    description: "Peut voir le role d'un joueur chaque nuit",
    min: 0,
    max: 1,
  },
  {
    role: "witch",
    label: "Sorciere",
    emoji: "🧪",
    description: "Potion de vie et potion de mort",
    min: 0,
    max: 1,
  },
  {
    role: "hunter",
    label: "Chasseur",
    emoji: "🏹",
    description: "Emporte un joueur en mourant",
    min: 0,
    max: 1,
  },
];

const TIMER_OPTIONS = [1, 2, 3, 4, 5];

export default function RolesSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const playerCount = state.players.length;

  const [counts, setCounts] = useState<Record<Role, number>>({
    werewolf: 2,
    villager: 0,
    seer: 1,
    witch: 1,
    hunter: 1,
  });

  const specialCount = ROLE_CONFIGS.reduce(
    (sum, rc) => sum + (counts[rc.role] || 0),
    0
  );
  const villagerCount = playerCount - specialCount;
  const isValid = villagerCount >= 0 && counts.werewolf >= 1;

  const updateCount = (role: Role, delta: number) => {
    const config = ROLE_CONFIGS.find((rc) => rc.role === role)!;
    const newVal = Math.max(config.min, Math.min(config.max, counts[role] + delta));
    setCounts({ ...counts, [role]: newVal });
  };

  const handleStart = () => {
    const roles: { role: Role; count: number }[] = [
      ...ROLE_CONFIGS.map((rc) => ({ role: rc.role, count: counts[rc.role] })),
      { role: "villager" as Role, count: villagerCount },
    ];
    dispatch({ type: "SET_ROLES", roles });
    dispatch({ type: "START_DISTRIBUTION" });
    router.push("/distribution");
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Roles" }} />

      <Text style={styles.header}>
        {playerCount} joueurs — configurez les roles
      </Text>

      {ROLE_CONFIGS.map((rc) => (
        <View key={rc.role} style={styles.roleRow}>
          <View style={styles.roleInfo}>
            <Text style={styles.roleLabel}>
              {rc.emoji} {rc.label}
            </Text>
            <Text style={styles.roleDesc}>{rc.description}</Text>
          </View>
          <View style={styles.counter}>
            <Pressable
              onPress={() => updateCount(rc.role, -1)}
              style={styles.counterBtn}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </Pressable>
            <Text style={styles.counterValue}>{counts[rc.role]}</Text>
            <Pressable
              onPress={() => updateCount(rc.role, 1)}
              style={styles.counterBtn}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.villagerRow}>
        <Text style={styles.roleLabel}>🧑‍🌾 Villageois</Text>
        <Text
          style={[
            styles.villagerCount,
            villagerCount < 0 && styles.errorText,
          ]}
        >
          {villagerCount < 0 ? `${villagerCount} (trop de roles!)` : villagerCount}
        </Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.timerTitle}>Timer de debat</Text>
      <View style={styles.timerRow}>
        {TIMER_OPTIONS.map((min) => (
          <Pressable
            key={min}
            style={[
              styles.timerOption,
              state.debateTimerMinutes === min && styles.timerOptionActive,
            ]}
            onPress={() => dispatch({ type: "SET_TIMER", minutes: min })}
          >
            <Text
              style={[
                styles.timerOptionText,
                state.debateTimerMinutes === min && styles.timerOptionTextActive,
              ]}
            >
              {min} min
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.startButton, !isValid && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={!isValid}
      >
        <Text style={styles.startButtonText}>Distribuer les roles</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  roleInfo: {
    flex: 1,
    marginRight: 12,
  },
  roleLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  roleDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  counterBtn: {
    backgroundColor: colors.surfaceLight,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },
  counterValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  villagerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  villagerCount: {
    color: colors.success,
    fontSize: 20,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceLight,
    marginVertical: 16,
  },
  timerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  timerOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  timerOptionActive: {
    backgroundColor: colors.primary,
  },
  timerOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  timerOptionTextActive: {
    color: colors.white,
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
```

- [ ] **Step 2: Verify in Expo Go**

Navigate from home → players (add 5+) → roles. Verify: role counters work, villager count auto-calculates, timer selector works, "Distribuer les roles" disabled if invalid.

- [ ] **Step 3: Commit**

```bash
git add app/roles-setup.tsx
git commit -m "feat: add roles setup screen with role counters and timer config"
```

---

### Task 8: DistributionScreen

**Files:**
- Create: `app/distribution.tsx`

- [ ] **Step 1: Create the distribution screen**

Create `app/distribution.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const currentPlayer = state.players[state.distributionIndex];
  if (!currentPlayer) return null;

  const roleInfo = currentPlayer.role
    ? ROLE_LABELS[currentPlayer.role]
    : null;

  const handleNext = () => {
    dispatch({ type: "NEXT_PLAYER" });
    // If last player, NEXT_PLAYER sets phase to "night" — navigate
    if (state.distributionIndex + 1 >= state.players.length) {
      router.replace("/night");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Distribution", headerBackVisible: false }}
      />

      {!state.revealedRole ? (
        <>
          <Text style={styles.instruction}>
            Passez le telephone a :
          </Text>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.hint}>
            {state.distributionIndex + 1} / {state.players.length}
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => dispatch({ type: "REVEAL_ROLE" })}
          >
            <Text style={styles.buttonText}>Voir mon role</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.roleEmoji}>{roleInfo?.emoji}</Text>
          <Text style={styles.roleName}>
            {roleInfo?.label}
          </Text>
          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>J'ai compris, suivant</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 8,
  },
  playerName: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 16,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 32,
  },
  roleEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  roleName: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Verify in Expo Go**

Full flow: home → players → roles → distribution. Verify: each player sees "Passez le telephone a: [name]", tap reveals role with emoji, tap again goes to next. After last player, navigates away.

- [ ] **Step 3: Commit**

```bash
git add app/distribution.tsx
git commit -m "feat: add role distribution screen with reveal mechanic"
```

---

### Task 9: NightScreen

**Files:**
- Create: `app/night.tsx`

- [ ] **Step 1: Create the night screen**

Create `app/night.tsx`:

```typescript
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
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

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const aliveNonWolves = alivePlayers.filter((p) => p.role !== "werewolf");

  const handleNextStep = () => {
    dispatch({ type: "NEXT_NIGHT_STEP" });
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_NIGHT" });
  };

  // After RESOLVE_NIGHT, phase changes — need to navigate
  if (state.phase === "hunter") {
    router.replace("/hunter");
    return null;
  }
  if (state.phase === "day") {
    router.replace("/day");
    return null;
  }
  if (state.phase === "end") {
    router.replace("/end");
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: `Nuit ${state.turn}`, headerBackVisible: false }}
      />

      {state.nightStep === "intro" && (
        <View style={styles.centered}>
          <Text style={styles.emoji}>🌙</Text>
          <Text style={styles.title}>La nuit tombe...</Text>
          <Text style={styles.subtitle}>Tout le monde ferme les yeux</Text>
          <Pressable style={styles.button} onPress={handleNextStep}>
            <Text style={styles.buttonText}>Continuer</Text>
          </Pressable>
        </View>
      )}

      {state.nightStep === "werewolves" && (
        <View style={styles.fullContainer}>
          <Text style={styles.stepTitle}>🐺 Les Loups-Garous se reveillent</Text>
          <Text style={styles.instruction}>
            Choisissez une victime :
          </Text>
          <FlatList
            data={aliveNonWolves}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.playerOption,
                  state.nightActions.werewolvesTarget === item.id &&
                    styles.playerOptionSelected,
                ]}
                onPress={() =>
                  dispatch({
                    type: "SET_WEREWOLF_TARGET",
                    playerId: item.id,
                  })
                }
              >
                <Text style={styles.playerOptionText}>{item.name}</Text>
              </Pressable>
            )}
          />
          <Pressable
            style={[
              styles.button,
              !state.nightActions.werewolvesTarget && styles.buttonDisabled,
            ]}
            onPress={handleNextStep}
            disabled={!state.nightActions.werewolvesTarget}
          >
            <Text style={styles.buttonText}>Confirmer</Text>
          </Pressable>
        </View>
      )}

      {state.nightStep === "seer" && (
        <View style={styles.fullContainer}>
          <Text style={styles.stepTitle}>🔮 La Voyante se reveille</Text>
          <Text style={styles.instruction}>
            Choisissez un joueur a inspecter :
          </Text>
          {state.nightActions.seerTarget ? (
            <View style={styles.centered}>
              <Text style={styles.revealName}>
                {state.players.find((p) => p.id === state.nightActions.seerTarget)?.name}
              </Text>
              <Text style={styles.revealRole}>
                {ROLE_LABELS[
                  state.players.find(
                    (p) => p.id === state.nightActions.seerTarget
                  )?.role ?? "villager"
                ]}
              </Text>
              <Pressable style={styles.button} onPress={handleNextStep}>
                <Text style={styles.buttonText}>Continuer</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={alivePlayers.filter(
                (p) => p.role !== "seer"
              )}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.playerOption}
                  onPress={() =>
                    dispatch({
                      type: "SET_SEER_TARGET",
                      playerId: item.id,
                    })
                  }
                >
                  <Text style={styles.playerOptionText}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {state.nightStep === "witch" && (
        <WitchStep
          state={state}
          dispatch={dispatch}
          onNext={handleNextStep}
          aliveNonWolves={aliveNonWolves}
          alivePlayers={alivePlayers}
        />
      )}

      {state.nightStep === "resolution" && (
        <View style={styles.centered}>
          <Text style={styles.emoji}>☀️</Text>
          <Text style={styles.title}>Le soleil se leve...</Text>
          <Pressable style={styles.button} onPress={handleResolve}>
            <Text style={styles.buttonText}>Reveler les evenements</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Witch sub-component (kept in same file — tightly coupled to night flow)
function WitchStep({
  state,
  dispatch,
  onNext,
  alivePlayers,
}: {
  state: ReturnType<typeof useGame>["state"];
  dispatch: ReturnType<typeof useGame>["dispatch"];
  onNext: () => void;
  aliveNonWolves: ReturnType<typeof useGame>["state"]["players"];
  alivePlayers: ReturnType<typeof useGame>["state"]["players"];
}) {
  const victim = state.players.find(
    (p) => p.id === state.nightActions.werewolvesTarget
  );
  const canHeal = state.witchPotions.life && !state.nightActions.witchHeal;
  const canKill = state.witchPotions.death && !state.nightActions.witchKill;

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.stepTitle}>🧪 La Sorciere se reveille</Text>

      {victim && (
        <Text style={styles.instruction}>
          Cette nuit, {victim.name} a ete attaque(e).
        </Text>
      )}

      {canHeal && victim && (
        <Pressable
          style={[styles.potionButton, styles.potionLife]}
          onPress={() => dispatch({ type: "SET_WITCH_HEAL", heal: true })}
        >
          <Text style={styles.buttonText}>💚 Utiliser la potion de vie</Text>
        </Pressable>
      )}

      {state.nightActions.witchHeal && (
        <Text style={styles.potionUsed}>
          ✅ Potion de vie utilisee
        </Text>
      )}

      {canKill && (
        <>
          <Text style={styles.instruction}>Empoisonner quelqu'un ?</Text>
          <FlatList
            data={alivePlayers.filter(
              (p) =>
                p.role !== "witch" &&
                p.id !== state.nightActions.werewolvesTarget
            )}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.playerOption,
                  state.nightActions.witchKill === item.id &&
                    styles.playerOptionDanger,
                ]}
                onPress={() =>
                  dispatch({
                    type: "SET_WITCH_KILL",
                    playerId:
                      state.nightActions.witchKill === item.id
                        ? null
                        : item.id,
                  })
                }
              >
                <Text style={styles.playerOptionText}>{item.name}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullContainer: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 48,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  playerOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionSelected: {
    backgroundColor: colors.primary,
  },
  playerOptionDanger: {
    backgroundColor: colors.danger,
  },
  playerOptionText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  revealName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  revealRole: {
    color: colors.warning,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 32,
  },
  potionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  potionLife: {
    backgroundColor: "#2d6a4f",
  },
  potionUsed: {
    color: colors.success,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
});
```

- [ ] **Step 2: Verify in Expo Go**

Full flow through night. Verify: intro screen, wolf selection, seer reveal (if present), witch options (if present), resolution trigger.

- [ ] **Step 3: Commit**

```bash
git add app/night.tsx
git commit -m "feat: add night screen with werewolf/seer/witch phases"
```

---

### Task 10: DayScreen

**Files:**
- Create: `app/day.tsx`

- [ ] **Step 1: Create the day screen with debate timer**

Create `app/day.tsx`:

```typescript
import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

type DayStep = "announce" | "debate" | "vote";

export default function DayScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [dayStep, setDayStep] = useState<DayStep>("announce");
  const [secondsLeft, setSecondsLeft] = useState(
    state.debateTimerMinutes * 60
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (dayStep === "debate" && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setDayStep("vote");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dayStep]);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const deadNames = state.nightDeaths
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const handleVote = (playerId: string) => {
    dispatch({ type: "VOTE_ELIMINATE", playerId });
  };

  // After VOTE_ELIMINATE, phase changes — navigate
  if (state.phase === "hunter") {
    router.replace("/hunter");
    return null;
  }
  if (state.phase === "night") {
    router.replace("/night");
    return null;
  }
  if (state.phase === "end") {
    router.replace("/end");
    return null;
  }

  const alivePlayers = state.players.filter((p) => p.isAlive);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: `Jour ${state.turn}`, headerBackVisible: false }}
      />

      {dayStep === "announce" && (
        <View style={styles.centered}>
          <Text style={styles.emoji}>☀️</Text>
          <Text style={styles.title}>Le village se reveille</Text>
          {deadNames.length === 0 ? (
            <Text style={styles.announcement}>
              Personne n'est mort cette nuit !
            </Text>
          ) : (
            <>
              <Text style={styles.announcement}>
                Cette nuit, le village a perdu :
              </Text>
              {deadNames.map((name) => (
                <Text key={name} style={styles.deadName}>
                  💀 {name}
                </Text>
              ))}
            </>
          )}
          <Pressable
            style={styles.button}
            onPress={() => setDayStep("debate")}
          >
            <Text style={styles.buttonText}>Lancer le debat</Text>
          </Pressable>
        </View>
      )}

      {dayStep === "debate" && (
        <View style={styles.centered}>
          <Text style={styles.title}>Debat en cours</Text>
          <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
          <Text style={styles.subtitle}>
            Les villageois debattent...
          </Text>
          <Pressable
            style={styles.skipButton}
            onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setDayStep("vote");
            }}
          >
            <Text style={styles.skipButtonText}>Passer au vote</Text>
          </Pressable>
        </View>
      )}

      {dayStep === "vote" && (
        <View style={styles.fullContainer}>
          <Text style={styles.stepTitle}>🗳️ Vote du village</Text>
          <Text style={styles.instruction}>
            Qui le village elimine-t-il ?
          </Text>
          <FlatList
            data={alivePlayers}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.playerOption}
                onPress={() => handleVote(item.id)}
              >
                <Text style={styles.playerOptionText}>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullContainer: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 32,
  },
  announcement: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  deadName: {
    color: colors.danger,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  timer: {
    color: colors.warning,
    fontSize: 72,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  playerOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
```

- [ ] **Step 2: Verify in Expo Go**

Full flow through to day. Verify: death announcement, debate timer counts down, "Passer au vote" skips timer, vote selects a player.

- [ ] **Step 3: Commit**

```bash
git add app/day.tsx
git commit -m "feat: add day screen with death announcements, debate timer, and vote"
```

---

### Task 11: HunterScreen

**Files:**
- Create: `app/hunter.tsx`

- [ ] **Step 1: Create the hunter screen**

Create `app/hunter.tsx`:

```typescript
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

export default function HunterScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const hunter = state.players.find(
    (p) => p.role === "hunter" && !p.isAlive
  );

  const handleShoot = (playerId: string) => {
    dispatch({ type: "HUNTER_SHOOT", playerId });
  };

  // After HUNTER_SHOOT, phase changes — navigate
  if (state.phase === "day") {
    router.replace("/day");
    return null;
  }
  if (state.phase === "night") {
    router.replace("/night");
    return null;
  }
  if (state.phase === "end") {
    router.replace("/end");
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Chasseur", headerBackVisible: false }}
      />

      <View style={styles.header}>
        <Text style={styles.emoji}>🏹</Text>
        <Text style={styles.title}>
          {hunter?.name} etait le Chasseur !
        </Text>
        <Text style={styles.subtitle}>
          Avant de mourir, il peut emporter quelqu'un avec lui.
        </Text>
      </View>

      <FlatList
        data={alivePlayers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.playerOption}
            onPress={() => handleShoot(item.id)}
          >
            <Text style={styles.playerOptionText}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    padding: 24,
    paddingTop: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  playerOption: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerOptionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/hunter.tsx
git commit -m "feat: add hunter screen for last shot mechanic"
```

---

### Task 12: EndScreen

**Files:**
- Create: `app/end.tsx`

- [ ] **Step 1: Create the end screen**

Create `app/end.tsx`:

```typescript
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};

export default function EndScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const isWerewolfWin = state.winner === "werewolves";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Fin de partie", headerBackVisible: false }}
      />

      <View style={styles.header}>
        <Text style={styles.emoji}>{isWerewolfWin ? "🐺" : "🎉"}</Text>
        <Text style={styles.title}>
          {isWerewolfWin
            ? "Les Loups-Garous ont gagne !"
            : "Les Villageois ont gagne !"}
        </Text>
        <Text style={styles.subtitle}>
          Partie terminee en {state.turn} tour{state.turn > 1 ? "s" : ""}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recap des roles</Text>
      <FlatList
        data={state.players}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const roleInfo = item.role ? ROLE_LABELS[item.role] : null;
          return (
            <View
              style={[
                styles.playerRow,
                !item.isAlive && styles.playerDead,
              ]}
            >
              <Text style={styles.playerName}>
                {roleInfo?.emoji} {item.name}
              </Text>
              <View style={styles.playerDetails}>
                <Text style={styles.roleName}>{roleInfo?.label}</Text>
                <Text
                  style={[
                    styles.status,
                    item.isAlive ? styles.alive : styles.dead,
                  ]}
                >
                  {item.isAlive ? "Survivant" : "Mort"}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <Pressable
        style={styles.button}
        onPress={() => {
          dispatch({ type: "RESET_GAME" });
          router.replace("/");
        }}
      >
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerDead: {
    opacity: 0.5,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  playerDetails: {
    alignItems: "flex-end",
  },
  roleName: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "600",
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
  alive: {
    color: colors.success,
  },
  dead: {
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/end.tsx
git commit -m "feat: add end screen with winner announcement and role recap"
```

---

### Task 13: Full Integration Test

- [ ] **Step 1: Run all unit tests**

```bash
npx jest --config='{"preset":"ts-jest","testEnvironment":"node"}' __tests__/gameReducer.test.ts
```

Expected: All tests PASS.

- [ ] **Step 2: Verify the app starts without errors**

```bash
npx expo start
```

- [ ] **Step 3: Manual walkthrough in Expo Go**

Test the complete flow:
1. Home → "Nouvelle partie"
2. Add 5 players by name
3. Configure roles (2 werewolves, 1 seer, 1 witch, 1 hunter → 0 villagers... adjust to have at least 1 villager with 6 players)
4. Distribute roles — each player sees their role
5. Night: wolves select target, seer inspects, witch decides
6. Day: see deaths, debate timer runs, vote to eliminate
7. Repeat night/day until victory
8. End screen shows winner + all roles
9. "Nouvelle partie" returns to home

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration testing fixes"
```

(Skip this step if no fixes needed.)

- [ ] **Step 5: Final commit tag**

```bash
git tag v0.1.0-prototype
```
