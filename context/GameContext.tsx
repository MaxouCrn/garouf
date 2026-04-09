import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Role } from "../game/roles";
import { NightStep, buildNightSteps } from "../game/nightEngine";
import {
  resolveNight as resolveNightFn,
  resolveVote as resolveVoteFn,
  generateLittleGirlClue,
} from "../game/resolution";

// Re-export so existing consumers keep working
export type { Role } from "../game/roles";
export type { NightStep } from "../game/nightEngine";

// --- Types ---

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
  winner: "werewolves" | "villagers" | "lovers" | null;
  debateTimerMinutes: number;
  selectedRoles: { role: Role; count: number }[];
  distributionIndex: number;
  revealedRole: boolean;
  nightDeaths: string[];
  hunterContext: "night" | "day" | null;
  lovers: [string, string] | null;
  saviorTarget: string | null;
  lastSaviorTarget: string | null;
  elderLives: number;
  ravenTarget: string | null;
  littleGirlClue: string[] | null;
  villageIdiotRevealed: boolean;
  isFirstNight: boolean;
  elderKilledByVillage: boolean;
  nightSteps: NightStep[];
  nightStepIndex: number;
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
  | { type: "RESET_GAME" }
  | { type: "SET_LOVERS"; player1Id: string; player2Id: string }
  | { type: "SET_SAVIOR_TARGET"; playerId: string }
  | { type: "SET_RAVEN_TARGET"; playerId: string | null }
  | { type: "SET_LITTLE_GIRL_CLUE"; clue: string[] };

// --- Helper functions ---

export function checkWinner(
  players: Player[],
  lovers?: [string, string] | null
): "werewolves" | "villagers" | "lovers" | null {
  const alivePlayers = players.filter((p) => p.isAlive);

  // Check lovers win condition first: mixed couple are the only 2 alive
  if (lovers) {
    const [id1, id2] = lovers;
    const lover1 = players.find((p) => p.id === id1);
    const lover2 = players.find((p) => p.id === id2);
    if (
      lover1?.isAlive &&
      lover2?.isAlive &&
      alivePlayers.length === 2
    ) {
      const isWolf1 = lover1.role === "werewolf";
      const isWolf2 = lover2.role === "werewolf";
      // Mixed couple: one wolf + one non-wolf
      if (isWolf1 !== isWolf2) {
        return "lovers";
      }
    }
  }

  const aliveWolves = alivePlayers.filter(
    (p) => p.role === "werewolf"
  ).length;
  const aliveVillagers = alivePlayers.filter(
    (p) => p.role !== "werewolf"
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
        const steps = buildNightSteps(state.players, true, 1, false);
        return {
          ...state,
          phase: "night",
          turn: 1,
          isFirstNight: true,
          nightSteps: steps,
          nightStepIndex: 0,
          nightStep: steps[0],
        };
      }
      return {
        ...state,
        distributionIndex: nextIndex,
        revealedRole: false,
      };
    }

    case "START_NIGHT": {
      // Increment turn when called manually from day phase (e.g. village idiot survival)
      const nextTurn = state.phase === "day" ? state.turn + 1 : state.turn;
      const steps = buildNightSteps(
        state.players,
        state.isFirstNight,
        nextTurn,
        state.elderKilledByVillage
      );
      return {
        ...state,
        phase: "night",
        turn: nextTurn,
        nightStep: steps[0],
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
        nightSteps: steps,
        nightStepIndex: 0,
        saviorTarget: null,
        ravenTarget: null,
        littleGirlClue: null,
      };
    }

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
      const nextIdx = state.nightStepIndex + 1;
      if (nextIdx >= state.nightSteps.length) return state;
      const nextStep = state.nightSteps[nextIdx];
      let clue = state.littleGirlClue;
      if (nextStep === "little_girl") {
        clue = generateLittleGirlClue(state.players);
      }
      return {
        ...state,
        nightStepIndex: nextIdx,
        nightStep: nextStep,
        littleGirlClue: clue,
      };
    }

    case "RESOLVE_NIGHT": {
      const resolution = resolveNightFn({
        players: state.players,
        nightActions: state.nightActions,
        witchPotions: state.witchPotions,
        saviorTarget: state.saviorTarget,
        elderLives: state.elderLives,
        lovers: state.lovers,
        elderKilledByVillage: state.elderKilledByVillage,
      });

      // Apply deaths
      const updatedPlayers = state.players.map((p) =>
        resolution.deaths.includes(p.id) ? { ...p, isAlive: false } : p
      );

      const winner = checkWinner(updatedPlayers, state.lovers);

      if (resolution.hunterTriggered && !winner && !state.elderKilledByVillage) {
        return {
          ...state,
          players: updatedPlayers,
          witchPotions: resolution.updatedPotions,
          nightDeaths: resolution.deaths,
          elderLives: resolution.newElderLives,
          phase: "hunter",
          hunterContext: "night",
          lastSaviorTarget: state.saviorTarget,
          isFirstNight: false,
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        witchPotions: resolution.updatedPotions,
        nightDeaths: resolution.deaths,
        elderLives: resolution.newElderLives,
        phase: winner ? "end" : "day",
        winner,
        lastSaviorTarget: state.saviorTarget,
        isFirstNight: false,
      };
    }

    case "START_DAY":
      return { ...state, phase: "day" };

    case "VOTE_ELIMINATE": {
      const voteResult = resolveVoteFn(
        {
          players: state.players,
          lovers: state.lovers,
          villageIdiotRevealed: state.villageIdiotRevealed,
          elderKilledByVillage: state.elderKilledByVillage,
        },
        action.playerId
      );

      // Village idiot survives
      if (voteResult.villageIdiotSurvived) {
        return {
          ...state,
          villageIdiotRevealed: true,
        };
      }

      // Apply deaths
      const updatedPlayers = state.players.map((p) =>
        voteResult.deaths.includes(p.id) ? { ...p, isAlive: false } : p
      );

      const winner = checkWinner(updatedPlayers, state.lovers);

      // Hunter check: only trigger if NOT elderKilledByVillage
      if (voteResult.hunterTriggered && !winner && !voteResult.elderKilledByVillage) {
        return {
          ...state,
          players: updatedPlayers,
          phase: "hunter",
          hunterContext: "day",
          elderKilledByVillage: voteResult.elderKilledByVillage,
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
        elderKilledByVillage: voteResult.elderKilledByVillage,
      };
    }

    case "HUNTER_SHOOT": {
      let updatedPlayers = state.players.map((p) =>
        p.id === action.playerId ? { ...p, isAlive: false } : p
      );

      // Lovers cascade: if target is a lover, kill the other too
      if (state.lovers) {
        const [l1, l2] = state.lovers;
        if (action.playerId === l1) {
          updatedPlayers = updatedPlayers.map((p) =>
            p.id === l2 ? { ...p, isAlive: false } : p
          );
        } else if (action.playerId === l2) {
          updatedPlayers = updatedPlayers.map((p) =>
            p.id === l1 ? { ...p, isAlive: false } : p
          );
        }
      }

      const winner = checkWinner(updatedPlayers, state.lovers);

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

      // hunterContext === "day" -> go to night
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
      const winner = checkWinner(state.players, state.lovers);
      if (winner) {
        return { ...state, phase: "end", winner };
      }
      return state;
    }

    case "SET_LOVERS":
      return { ...state, lovers: [action.player1Id, action.player2Id] };

    case "SET_SAVIOR_TARGET":
      return { ...state, saviorTarget: action.playerId };

    case "SET_RAVEN_TARGET":
      return { ...state, ravenTarget: action.playerId };

    case "SET_LITTLE_GIRL_CLUE":
      return { ...state, littleGirlClue: action.clue };

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
