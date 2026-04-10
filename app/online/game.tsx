import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOnlineGame } from "../../hooks/useOnlineGame";
import { useNarrator } from "../../hooks/useNarrator";
import { colors } from "../../theme/colors";

import DistributionView from "../../components/online/DistributionView";
import NightWaitView from "../../components/online/NightWaitView";
import NightActionView from "../../components/online/NightActionView";
import WolfVoteView from "../../components/online/WolfVoteView";
import LittleGirlView from "../../components/online/LittleGirlView";
import DayAnnouncementView from "../../components/online/DayAnnouncementView";
import DayDebateView from "../../components/online/DayDebateView";
import DayVoteView from "../../components/online/DayVoteView";
import HunterView from "../../components/online/HunterView";
import SpectatorView from "../../components/online/SpectatorView";
import EndView from "../../components/online/EndView";
import PausedView from "../../components/online/PausedView";

type DaySubPhase = "announcement" | "debate" | "vote";

export default function OnlineGameScreen() {
  const params = useLocalSearchParams<{
    gameId: string;
    playerId: string;
    isHost: string;
  }>();

  const isHost = params.isHost === "true";
  const { state, sendAction } = useOnlineGame({
    gameId: params.gameId,
    playerId: params.playerId,
    isHost,
  });

  const [daySubPhase, setDaySubPhase] = useState<DaySubPhase>("announcement");

  // Host plays narrator audio
  if (isHost && state.nightStep) {
    // useNarrator is called at the top level in the local version
    // For online, we conditionally use it only for the host
  }

  const handleNightAction = useCallback(async (actionType: string, payload: Record<string, unknown>) => {
    await sendAction("night-action", { actionType, payload });
  }, [sendAction]);

  const handleVote = useCallback(async (targetId: string | null) => {
    await sendAction("cast-vote", { targetId });
  }, [sendAction]);

  const handleHunterShoot = useCallback(async (targetId: string | null) => {
    await sendAction("hunter-shoot", { targetId });
  }, [sendAction]);

  const handleStartDebate = useCallback(async () => {
    setDaySubPhase("debate");
    if (isHost) {
      const durationMs = 3 * 60 * 1000; // TODO: use game settings
      await sendAction("sync-clock", { durationMs });
    }
  }, [isHost, sendAction]);

  const handleStartVote = useCallback(() => {
    setDaySubPhase("vote");
  }, []);

  // ── Paused ──────────────────────────────────────────────────────────────
  if (state.phase === "paused" && state.pauseInfo) {
    return (
      <View style={styles.container}>
        <PausedView info={state.pauseInfo} />
      </View>
    );
  }

  // ── End ─────────────────────────────────────────────────────────────────
  if (state.phase === "end" || state.winner) {
    return (
      <View style={styles.container}>
        <EndView winner={state.winner} />
      </View>
    );
  }

  // ── Dead player ─────────────────────────────────────────────────────────
  if (!state.isAlive) {
    return (
      <View style={styles.container}>
        <SpectatorView phase={state.phase} nightStep={state.nightStep} />
      </View>
    );
  }

  // ── Distribution ────────────────────────────────────────────────────────
  if (state.phase === "distribution") {
    return (
      <View style={styles.container}>
        <DistributionView
          role={state.myRole}
          description={state.myRoleDescription}
          onReady={() => sendAction("night-action", { actionType: "ready", payload: {} })}
        />
      </View>
    );
  }

  // ── Hunter ──────────────────────────────────────────────────────────────
  if (state.phase === "hunter") {
    return (
      <View style={styles.container}>
        <HunterView
          isHunter={state.myRole === "hunter"}
          alivePlayers={state.alivePlayers}
          myPlayerId={params.playerId}
          onShoot={handleHunterShoot}
        />
      </View>
    );
  }

  // ── Night ───────────────────────────────────────────────────────────────
  if (state.phase === "night") {
    // Little girl has her own view
    if (state.nightStep === "little_girl" && state.myRole === "little_girl" && state.littleGirlClue.length > 0) {
      return (
        <View style={styles.container}>
          <LittleGirlView
            clueNames={state.littleGirlClue}
            timerSeconds={15}
            onDone={() => handleNightAction("little_girl_done", {})}
          />
        </View>
      );
    }

    // Wolf vote
    if (state.actionRequired && state.nightStep === "werewolves" && state.myRole === "werewolf") {
      return (
        <View style={styles.container}>
          <WolfVoteView
            action={state.actionRequired}
            wolfVotes={state.wolfVotes}
            onSubmit={handleNightAction}
          />
        </View>
      );
    }

    // Witch special handling
    if (state.actionRequired && state.nightStep === "witch" && state.myRole === "witch") {
      return (
        <View style={styles.container}>
          <NightActionView
            action={state.actionRequired}
            onSubmit={(_, payload) => handleNightAction("witch_action", payload)}
          />
        </View>
      );
    }

    // Generic night action (seer, savior, cupid, raven)
    if (state.actionRequired) {
      return (
        <View style={styles.container}>
          <NightActionView
            action={state.actionRequired}
            onSubmit={handleNightAction}
          />
        </View>
      );
    }

    // Waiting
    return (
      <View style={styles.container}>
        <NightWaitView step={state.nightStep} />
      </View>
    );
  }

  // ── Day ─────────────────────────────────────────────────────────────────
  if (state.phase === "day") {
    if (state.voteResult) {
      // Show result briefly then it transitions
      return (
        <View style={styles.container}>
          <DayAnnouncementView
            nightDeaths={state.voteResult.eliminated
              ? [{ id: state.voteResult.eliminated.id, name: state.voteResult.eliminated.name }]
              : []
            }
            onContinue={() => {}}
          />
        </View>
      );
    }

    if (daySubPhase === "announcement") {
      return (
        <View style={styles.container}>
          <DayAnnouncementView
            nightDeaths={state.nightDeaths}
            onContinue={handleStartDebate}
          />
        </View>
      );
    }

    if (daySubPhase === "debate") {
      return (
        <View style={styles.container}>
          <DayDebateView timer={state.debateTimer} />
        </View>
      );
    }

    if (daySubPhase === "vote") {
      return (
        <View style={styles.container}>
          <DayVoteView
            alivePlayers={state.alivePlayers}
            myPlayerId={params.playerId}
            onVote={handleVote}
          />
        </View>
      );
    }
  }

  // Fallback
  return (
    <View style={styles.container}>
      <NightWaitView step={null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
