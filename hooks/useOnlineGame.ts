import { useState, useCallback, useMemo } from "react";
import { useChannel } from "./useChannel";
import { supabase } from "../lib/supabase";
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

  const onMessage = useMemo(() => ({
    // ── Public events ───────────────────────────────────────────────────
    "game:phase": (payload: Record<string, unknown>) => {
      const data = payload as unknown as GamePhasePayload;
      setState((prev) => ({
        ...prev,
        phase: data.phase as OnlineGameState["phase"],
        turn: data.turn,
        nightStep: data.nightStep ?? null,
        // Reset per-phase state
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
