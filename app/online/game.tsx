import { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOnlineGame } from "../../hooks/useOnlineGame";
import { useNarrator } from "../../hooks/useNarrator";
import { useMusicContext } from "../../context/MusicContext";
import type { NightStep } from "../../game/nightEngine";
import { ROLE_LABELS } from "../../theme/roleCards";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { Role } from "../../game/roles";

import DistributionView from "../../components/online/DistributionView";
import NightWaitView from "../../components/online/NightWaitView";
import NightActionView from "../../components/online/NightActionView";
import WitchActionView from "../../components/online/WitchActionView";
import WolfVoteView from "../../components/online/WolfVoteView";
import LittleGirlView from "../../components/online/LittleGirlView";
import DayAnnouncementView from "../../components/online/DayAnnouncementView";
import DayDebateView from "../../components/online/DayDebateView";
import DayVoteView from "../../components/online/DayVoteView";
import HunterView from "../../components/online/HunterView";
import SpectatorView from "../../components/online/SpectatorView";
import EndView from "../../components/online/EndView";
import PausedView from "../../components/online/PausedView";

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

  const { stopMusic } = useMusicContext();

  // Seer result stored locally after HTTP response
  const [seerResult, setSeerResult] = useState<{ name: string; role: string } | null>(null);

  // Stop home music when entering the game
  useEffect(() => {
    stopMusic();
  }, []);

  // Reset seer result when night step changes
  useEffect(() => {
    setSeerResult(null);
  }, [state.nightStep]);

  // Host plays narrator audio during night phase
  const narratorEnabled = isHost && state.phase === "night";
  useNarrator((state.nightStep as NightStep) ?? "intro", narratorEnabled);

  const handleNightAction = useCallback(async (actionType: string, payload: Record<string, unknown>) => {
    const result = await sendAction("night-action", { actionType, payload });
    // Read seer result from HTTP response
    if (actionType === "seer_inspect" && result?.seerResult) {
      setSeerResult(result.seerResult);
    }
  }, [sendAction]);

  const handleVote = useCallback(async (targetId: string | null) => {
    await sendAction("cast-vote", { targetId });
  }, [sendAction]);

  const handleHunterShoot = useCallback(async (targetId: string | null) => {
    await sendAction("hunter-shoot", { targetId });
  }, [sendAction]);

  const handleStartDebate = useCallback(async () => {
    const durationMs = 3 * 60 * 1000;
    await sendAction("update-day-phase", {
      daySubPhase: "debate",
      debateStartedAt: Date.now(),
      debateDurationMs: durationMs,
    });
  }, [sendAction]);

  const handleStartVote = useCallback(async () => {
    await sendAction("update-day-phase", { daySubPhase: "vote" });
  }, [sendAction]);

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
          isHost={isHost}
          onStartNight={() => sendAction("start-night", {})}
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
    // Little girl
    if (state.nightStep === "little_girl" && state.myRole === "little_girl" && state.littleGirlClue.length > 0) {
      return (
        <ImageBackground source={require("../../assets/night-transition-background.png")} style={styles.container} resizeMode="cover">
          <LittleGirlView clueNames={state.littleGirlClue} timerSeconds={15} onDone={() => handleNightAction("little_girl_done", {})} />
        </ImageBackground>
      );
    }

    // Wolf vote
    if (state.actionRequired && state.nightStep === "werewolves" && state.myRole === "werewolf") {
      return (
        <ImageBackground source={require("../../assets/night-transition-background.png")} style={styles.container} resizeMode="cover">
          <WolfVoteView action={state.actionRequired} wolfVotes={state.wolfVotes} onSubmit={handleNightAction} />
        </ImageBackground>
      );
    }

    // Seer result: show inspected role after action
    if (state.nightStep === "seer" && state.myRole === "seer" && seerResult) {
      const roleKey = seerResult.role as Role;
      const roleLabel = ROLE_LABELS[roleKey];
      return (
        <ImageBackground source={require("../../assets/night-transition-background.png")} style={styles.container} resizeMode="cover">
          <View style={styles.centeredContent}>
            <Text style={styles.resultLabel}>Le role de {seerResult.name} est :</Text>
            <Text style={styles.resultEmoji}>{roleLabel?.emoji ?? "?"}</Text>
            <Text style={styles.resultRole}>{roleLabel?.label ?? seerResult.role}</Text>
            <Text style={styles.resultWait}>En attente de la phase suivante...</Text>
          </View>
        </ImageBackground>
      );
    }

    // Witch
    if (state.actionRequired && state.nightStep === "witch" && state.myRole === "witch") {
      return (
        <ImageBackground source={require("../../assets/night-transition-background.png")} style={styles.container} resizeMode="cover">
          <WitchActionView action={state.actionRequired} onSubmit={handleNightAction} />
        </ImageBackground>
      );
    }

    // Generic night action (seer, savior, cupid, raven)
    if (state.actionRequired) {
      return (
        <ImageBackground source={require("../../assets/night-transition-background.png")} style={styles.container} resizeMode="cover">
          <NightActionView action={state.actionRequired} onSubmit={handleNightAction} />
        </ImageBackground>
      );
    }

    // Waiting
    return (
      <ImageBackground source={require("../../assets/night-transition-background.png")} style={styles.container} resizeMode="cover">
        <NightWaitView step={state.nightStep} />
      </ImageBackground>
    );
  }

  // ── Day ─────────────────────────────────────────────────────────────────
  if (state.phase === "day") {
    // Use server-synced daySubPhase
    const daySubPhase = state.daySubPhase;

    if (daySubPhase === "vote") {
      return (
        <ImageBackground source={require("../../assets/sun-transition-background.png")} style={styles.container} resizeMode="cover">
          <DayVoteView alivePlayers={state.alivePlayers} myPlayerId={params.playerId} onVote={handleVote} />
        </ImageBackground>
      );
    }

    if (daySubPhase === "debate") {
      return (
        <ImageBackground source={require("../../assets/debat-background.png")} style={styles.container} resizeMode="cover">
          <DayDebateView timer={state.debateTimer} isHost={isHost} onStartVote={handleStartVote} />
        </ImageBackground>
      );
    }

    // Default: announcement
    return (
      <ImageBackground source={require("../../assets/sun-transition-background.png")} style={styles.container} resizeMode="cover">
        <DayAnnouncementView
          nightDeaths={state.nightDeaths}
          isHost={isHost}
          myPlayerId={params.playerId}
          onContinue={handleStartDebate}
        />
      </ImageBackground>
    );
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
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  resultLabel: {
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  resultRole: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 24,
  },
  resultWait: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
