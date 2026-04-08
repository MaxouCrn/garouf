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

      // Hunter shoot: werewolves only win when they strictly outnumber villagers
      const aliveWolvesH = updatedPlayers.filter((p) => p.isAlive && p.role === "werewolf").length;
      const aliveVillagersH = updatedPlayers.filter((p) => p.isAlive && p.role !== "werewolf").length;
      const winner: "werewolves" | "villagers" | null =
        aliveWolvesH === 0 ? "villagers" : aliveWolvesH > aliveVillagersH ? "werewolves" : null;

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
