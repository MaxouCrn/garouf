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
