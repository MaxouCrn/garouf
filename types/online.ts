import type { Role } from "../game/roles";

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

// ── Join code ───────────────────────────────────────────────────────────────

export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
