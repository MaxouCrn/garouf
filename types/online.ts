import type { Role } from "../game/roles";
import type { NightStep } from "../game/nightEngine";

// ── Database row types ──────────────────────────────────────────────────────

export interface GameRow {
  id: string;
  code: string;
  status: "lobby" | "playing" | "finished";
  host_id: string | null;
  phase: string | null;
  state_snapshot: Record<string, unknown> | null;
  settings: GameSettings;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  game_id: string;
  user_id: string;
  name: string;
  role: Role | null;
  is_alive: boolean;
  is_connected: boolean;
  joined_at: string;
}

export interface ActionRow {
  id: string;
  game_id: string;
  player_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  phase: string;
  turn: number;
  created_at: string;
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface GameSettings {
  selectedRoles: { role: Role; count: number }[];
  debateTimerMinutes: number;
}

// ── Lobby player (public info only) ─────────────────────────────────────────

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
}

// ── Realtime message payloads ───────────────────────────────────────────────

export interface LobbyUpdatePayload {
  players: LobbyPlayer[];
}

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

export interface VoteLogPayload {
  voter: string;
  target: string | null;
}

export interface VoteResultPayload {
  eliminated: { id: string; name: string } | null;
  voteDetails: Record<string, string>;
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

export interface ReadyUpdatePayload {
  readyCount: number;
  totalPlayers: number;
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
  werewolfTarget?: { id: string; name: string } | null;
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
  votes: Record<string, number>;
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
  actionRequired: NightActionRequiredPayload | null;
  actionResult: NightActionResultPayload | null;
  wolfVotes: Record<string, number>;
  littleGirlClue: string[];
  loversReveal: LoversRevealPayload | null;
  voteStatus: VoteStatusPayload | null;
  voteLogs: VoteLogPayload[];
  voteResult: VoteResultPayload | null;
  debateTimer: TimerStartPayload | null;
  daySubPhase: "announcement" | "debate" | "vote";
  pauseInfo: GamePausedPayload | null;
  readyCount: number;
  totalPlayers: number;
}

// ── Join code ───────────────────────────────────────────────────────────────

export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
