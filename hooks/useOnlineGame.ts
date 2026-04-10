import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useChannel } from "./useChannel";
import { supabase } from "../lib/supabase";
import { ROLE_REGISTRY } from "../game/roles";
import type { Role } from "../game/roles";
import type { NightStep } from "../game/nightEngine";
import type {
  OnlineGameState,
  GamePhasePayload,
  GameStatePayload,
  NightStepPayload,
  VoteStatusPayload,
  VoteResultPayload,
  TimerStartPayload,
  GamePausedPayload,
  RoleAssignPayload,
  NightActionRequiredPayload,
  NightActionResultPayload,
  LoversRevealPayload,
  WolfVoteUpdatePayload,
  LittleGirlCluePayload,
} from "../types/online";

const INITIAL_STATE: OnlineGameState = {
  gameId: "",
  playerId: "",
  isHost: false,
  phase: "distribution",
  turn: 0,
  nightStep: null,
  myRole: null,
  myRoleDescription: null,
  isAlive: true,
  alivePlayers: [],
  nightDeaths: [],
  winner: null,
  actionRequired: null,
  actionResult: null,
  wolfVotes: {},
  littleGirlClue: [],
  loversReveal: null,
  voteStatus: null,
  voteResult: null,
  debateTimer: null,
  daySubPhase: "announcement",
  pauseInfo: null,
};

interface UseOnlineGameOptions {
  gameId: string;
  playerId: string;
  isHost: boolean;
}

export function useOnlineGame({ gameId, playerId, isHost }: UseOnlineGameOptions) {
  const [state, setState] = useState<OnlineGameState>({
    ...INITIAL_STATE,
    gameId,
    playerId,
    isHost,
  });

  // Poll server state every 2s for reliability (broadcasts are unreliable)
  useEffect(() => {
    let mounted = true;

    async function pollState() {
      try {
        const { data, error } = await supabase.functions.invoke("reconnect", {
          body: { gameId },
        });
        if (error || !data || !mounted) return;

        const role = data.player?.role as Role | null;
        const roleDesc = role ? ROLE_REGISTRY[role]?.description ?? null : null;
        const phase = data.game?.phase as OnlineGameState["phase"];
        const snapshot = data.snapshot || {};

        // Read day sub-phase and debate timer from snapshot
        const daySubPhase = snapshot.daySubPhase || "announcement";
        const debateTimer = (snapshot.debateStartedAt && snapshot.debateDurationMs)
          ? { startedAt: snapshot.debateStartedAt, durationMs: snapshot.debateDurationMs }
          : null;

        // Read night deaths from snapshot
        const nightDeathIds: string[] = snapshot.nightDeaths || [];
        const nightDeaths = nightDeathIds.map((id: string) => {
          const p = (data.alivePlayers || []).find((pl: { id: string }) => pl.id === id);
          return { id, name: p?.name || "?" };
        });

        setState((prev) => ({
          ...prev,
          phase: phase || prev.phase,
          turn: snapshot.turn || prev.turn,
          nightStep: snapshot.currentNightStep || prev.nightStep,
          myRole: role || prev.myRole,
          myRoleDescription: roleDesc || prev.myRoleDescription,
          isAlive: data.player?.isAlive ?? prev.isAlive,
          alivePlayers: data.alivePlayers || prev.alivePlayers,
          nightDeaths: nightDeaths.length > 0 ? nightDeaths : prev.nightDeaths,
          winner: phase === "end" ? (snapshot.winner || prev.winner) : prev.winner,
          daySubPhase: phase === "day" ? daySubPhase : "announcement",
          debateTimer: debateTimer || prev.debateTimer,
        }));
      } catch {
        // Ignore poll errors
      }
    }

    pollState();
    const interval = setInterval(pollState, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [gameId]);

  const onMessage = useMemo(() => ({
    // ── Public events ───────────────────────────────────────────────────
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

    "game:state": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GameStatePayload;
      setState((prev) => ({
        ...prev,
        alivePlayers: data.alivePlayers,
        nightDeaths: data.nightDeaths,
        winner: data.winner ?? null,
        isAlive: data.alivePlayers.some((p) => p.id === playerId),
      }));
    },

    "night:step": (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightStepPayload;
      setState((prev) => ({
        ...prev,
        nightStep: data.step,
        actionRequired: null,
        actionResult: null,
      }));
    },

    "vote:status": (payload: Record<string, unknown>) => {
      const data = payload as unknown as VoteStatusPayload;
      setState((prev) => ({ ...prev, voteStatus: data }));
    },

    "vote:result": (payload: Record<string, unknown>) => {
      const data = payload as unknown as VoteResultPayload;
      setState((prev) => ({ ...prev, voteResult: data }));
    },

    "timer:start": (payload: Record<string, unknown>) => {
      const data = payload as unknown as TimerStartPayload;
      setState((prev) => ({ ...prev, debateTimer: data }));
    },

    "game:paused": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GamePausedPayload;
      setState((prev) => ({ ...prev, phase: "paused", pauseInfo: data }));
    },

    "game:resumed": () => {
      setState((prev) => ({ ...prev, pauseInfo: null }));
    },

    // ── Private events (prefixed with player ID) ────────────────────────
    [`private:${playerId}:role:assign`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as RoleAssignPayload;
      setState((prev) => ({
        ...prev,
        myRole: data.role,
        myRoleDescription: data.description,
      }));
    },

    [`private:${playerId}:night:action_required`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightActionRequiredPayload;
      setState((prev) => ({ ...prev, actionRequired: data, actionResult: null }));
    },

    [`private:${playerId}:night:action_result`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as NightActionResultPayload;
      setState((prev) => ({ ...prev, actionResult: data }));
    },

    [`private:${playerId}:lovers:reveal`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as LoversRevealPayload;
      setState((prev) => ({ ...prev, loversReveal: data }));
    },

    [`private:${playerId}:wolf:vote_update`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as WolfVoteUpdatePayload;
      setState((prev) => ({ ...prev, wolfVotes: data.votes }));
    },

    [`private:${playerId}:little_girl:clue`]: (payload: Record<string, unknown>) => {
      const data = payload as unknown as LittleGirlCluePayload;
      setState((prev) => ({ ...prev, littleGirlClue: data.clueNames }));
    },
  }), [playerId]);

  useChannel({
    channelName: `game:${gameId}`,
    onMessage,
    enabled: !!gameId,
  });

  const sendAction = useCallback(async (
    functionName: string,
    body: Record<string, unknown>
  ) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { gameId, ...body },
    });
    if (error) throw error;
    return data;
  }, [gameId]);

  return { state, sendAction };
}
