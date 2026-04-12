import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Image, Pressable, StyleSheet, ImageBackground, Animated, Easing } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOnlineGame } from "../../hooks/useOnlineGame";
import { useNarrator } from "../../hooks/useNarrator";
import { useMusicContext } from "../../context/MusicContext";
import type { NightStep } from "../../game/nightEngine";
import { ROLE_CARDS, ROLE_LABELS } from "../../theme/roleCards";
import SafeContainer from "../../components/SafeContainer";
import GCardFrame from "../../components/GCardFrame";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii } from "../../theme/spacing";
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

/** Invisible component that fires onAdvance once after delayMs. */
function AutoAdvance({ delayMs, onAdvance }: { delayMs: number; onAdvance: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fired.current) { fired.current = true; onAdvance(); }
    }, delayMs);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

const SEER_CARD_WIDTH = 180;
const SEER_CARD_HEIGHT = 270;

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

  // Night transition animations
  const nightOpacity = useRef(new Animated.Value(0)).current;
  const sunriseOpacity = useRef(new Animated.Value(0)).current;

  // Stop home music when entering the game
  useEffect(() => {
    stopMusic();
  }, []);

  // Animate night intro / resolution transitions
  useEffect(() => {
    if (state.nightStep === "intro") {
      nightOpacity.setValue(0);
      sunriseOpacity.setValue(0);
      Animated.timing(nightOpacity, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (state.nightStep === "resolution") {
      sunriseOpacity.setValue(0);
      Animated.timing(sunriseOpacity, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [state.nightStep]);

  // Host plays narrator audio during night phase
  const narratorEnabled = isHost && state.phase === "night";
  const { narratorDone } = useNarrator((state.nightStep as NightStep) ?? "intro", narratorEnabled);

  // Auto-advance 1s after narrator finishes (intro & resolution steps)
  const advanceFired = useRef(false);
  useEffect(() => {
    advanceFired.current = false;
  }, [state.nightStep]);

  useEffect(() => {
    if (!isHost || !narratorDone || advanceFired.current) return;
    const step = state.nightStep;
    if (step !== "intro" && step !== "resolution") return;

    const timer = setTimeout(() => {
      if (advanceFired.current) return;
      advanceFired.current = true;
      if (step === "intro") {
        sendAction("night-action", { actionType: "advance_intro", payload: {} }).catch(() => {});
      } else if (step === "resolution") {
        sendAction("night-action", { actionType: "resolve_night", payload: {} }).catch(() => {});
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [narratorDone, isHost, state.nightStep, sendAction]);

  const handleNightAction = useCallback(async (actionType: string, payload: Record<string, unknown>) => {
    const result = await sendAction("night-action", { actionType, payload });
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
    return <View style={styles.container}><PausedView info={state.pauseInfo} /></View>;
  }

  // ── End ─────────────────────────────────────────────────────────────────
  if (state.phase === "end" || state.winner) {
    return <View style={styles.container}><EndView winner={state.winner} /></View>;
  }

  // ── Hunter (before dead-player check: the hunter must shoot even though dead) ──
  if (state.phase === "hunter") {
    return (
      <View style={styles.container}>
        <HunterView isHunter={state.myRole === "hunter"} alivePlayers={state.alivePlayers} myPlayerId={params.playerId} onShoot={handleHunterShoot} />
      </View>
    );
  }

  // ── Dead player (host still sees game screens to act as narrator) ──────
  if (!state.isAlive && !isHost) {
    return <View style={styles.container}><SpectatorView phase={state.phase} nightStep={state.nightStep} /></View>;
  }

  // ── Distribution ────────────────────────────────────────────────────────
  if (state.phase === "distribution") {
    return (
      <View style={styles.container}>
        <DistributionView
          role={state.myRole}
          description={state.myRoleDescription}
          isHost={isHost}
          onStartNight={() => sendAction("start-night", {}).catch(() => {})}
          onReady={() => sendAction("player-ready", { playerId: params.playerId }).catch(() => {})}
          readyCount={state.readyCount}
          totalPlayers={state.totalPlayers}
        />
      </View>
    );
  }

  // ── Night ───────────────────────────────────────────────────────────────
  if (state.phase === "night") {
    // Night background with transition animations (like local mode)
    const nightBg = (
      <View style={StyleSheet.absoluteFillObject}>
        <ImageBackground source={require("../../assets/sunset-background.png")} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: state.nightStep === "intro" ? nightOpacity : 1 }]}>
          <ImageBackground source={require("../../assets/night-transition-background.png")} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: sunriseOpacity }]}>
          <ImageBackground source={require("../../assets/sun-transition-background.png")} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        </Animated.View>
      </View>
    );

    // ── Intro phase: "La nuit tombe..." (auto-advance after 4s) ──
    if (state.nightStep === "intro") {
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <View style={styles.centered}>
              <GCardFrame variant="glass" corners>
                <View style={styles.transitionCard}>
                  <Text style={styles.nightTitle}>La nuit tombe...</Text>
                  <Text style={styles.nightSubtitle}>Tout le monde ferme les yeux</Text>
                </View>
              </GCardFrame>
            </View>
          </SafeContainer>
        </View>
      );
    }

    // ── Resolution phase: sunrise animation + deaths (auto-advance after 3s) ──
    if (state.nightStep === "resolution") {
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <View style={styles.centered}>
              <GCardFrame variant="glass" corners>
                <View style={styles.transitionCard}>
                  <Text style={styles.nightTitle}>Le soleil se leve...</Text>
                </View>
              </GCardFrame>
            </View>
          </SafeContainer>
        </View>
      );
    }

    // ── Little girl ──
    if (state.nightStep === "little_girl" && state.myRole === "little_girl" && state.littleGirlClue.length > 0) {
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <LittleGirlView clueNames={state.littleGirlClue} timerSeconds={15} onDone={() => handleNightAction("little_girl_done", {})} />
          </SafeContainer>
        </View>
      );
    }

    // ── Wolf vote ──
    if (state.actionRequired && state.nightStep === "werewolves" && state.myRole === "werewolf") {
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <WolfVoteView action={state.actionRequired} wolfVotes={state.wolfVotes} onSubmit={handleNightAction} />
          </SafeContainer>
        </View>
      );
    }

    // ── Seer result: show card of inspected player (auto-advance after 4s) ──
    if (state.nightStep === "seer" && state.myRole === "seer" && seerResult) {
      const roleKey = seerResult.role as Role;
      const roleLabel = ROLE_LABELS[roleKey];
      const cardImage = ROLE_CARDS[roleKey];
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <View style={styles.centered}>
              <Text style={styles.seerLabel}>Le joueur {seerResult.name} a le role :</Text>
              {cardImage ? (
                <Image source={cardImage} style={styles.seerCard} resizeMode="contain" />
              ) : (
                <View style={styles.seerFallbackCard}>
                  <Text style={styles.seerEmoji}>{roleLabel?.emoji ?? "?"}</Text>
                </View>
              )}
              <Text style={styles.seerRoleName}>{roleLabel?.label ?? seerResult.role}</Text>
              <AutoAdvance delayMs={4000} onAdvance={() => { handleNightAction("seer_done", {}); setSeerResult(null); }} />
            </View>
          </SafeContainer>
        </View>
      );
    }

    // ── Witch ──
    if (state.actionRequired && state.nightStep === "witch" && state.myRole === "witch") {
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <WitchActionView action={state.actionRequired} onSubmit={handleNightAction} />
          </SafeContainer>
        </View>
      );
    }

    // ── Generic night action (seer select, savior, cupid, raven) ──
    if (state.actionRequired) {
      return (
        <View style={styles.container}>
          {nightBg}
          <SafeContainer>
            <NightActionView action={state.actionRequired} onSubmit={handleNightAction} />
          </SafeContainer>
        </View>
      );
    }

    // ── Waiting screen (for non-active roles) ──
    return (
      <View style={styles.container}>
        {nightBg}
        <SafeContainer>
          <NightWaitView step={state.nightStep} />
        </SafeContainer>
      </View>
    );
  }

  // ── Day ─────────────────────────────────────────────────────────────────
  if (state.phase === "day") {
    const daySubPhase = state.daySubPhase;

    if (daySubPhase === "vote") {
      return (
        <ImageBackground source={require("../../assets/sun-transition-background.png")} style={styles.container} resizeMode="cover">
          <DayVoteView alivePlayers={state.alivePlayers} myPlayerId={params.playerId} onVote={handleVote} voteLogs={state.voteLogs} voteStatus={state.voteStatus} />
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

    return (
      <ImageBackground source={require("../../assets/sun-transition-background.png")} style={styles.container} resizeMode="cover">
        <DayAnnouncementView nightDeaths={state.nightDeaths} isHost={isHost} myPlayerId={params.playerId} onContinue={handleStartDebate} />
      </ImageBackground>
    );
  }

  return <View style={styles.container}><NightWaitView step={null} /></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  transitionCard: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 12,
  },
  nightTitle: {
    fontFamily: fonts.displayBold,
    color: colors.white,
    fontSize: 26,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  nightSubtitle: {
    fontFamily: fonts.bodyRegular,
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 48,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  nightButton: {
    backgroundColor: colors.glass,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginTop: 24,
  },
  nightButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
  waitText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 24,
  },
  // Seer result
  seerLabel: {
    fontFamily: fonts.bodyRegular,
    fontSize: 18,
    color: colors.white,
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  seerCard: {
    width: SEER_CARD_WIDTH,
    height: SEER_CARD_HEIGHT,
    borderRadius: radii.lg,
    marginBottom: 16,
  },
  seerFallbackCard: {
    width: SEER_CARD_WIDTH,
    height: SEER_CARD_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  seerEmoji: {
    fontSize: 64,
  },
  seerRoleName: {
    fontFamily: fonts.displayBold,
    color: colors.primary,
    fontSize: 24,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
