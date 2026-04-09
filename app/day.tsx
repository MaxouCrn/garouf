import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, ImageBackground, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Audio } from "expo-av";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ANNONCE_DEATH, ANNONCE_NO_DEATH } from "../assets/sounds/narrator/day/sounds";

const DEBAT_MUSIC = require("../assets/sounds/debat-music.mp3");
const DEBAT_VOLUME = 0.4;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type DayStep = "announce" | "raven_mark" | "debate" | "vote" | "vote_result";

export default function DayScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [dayStep, setDayStep] = useState<DayStep>("announce");
  const [isMuted, setIsMuted] = useState(false);
  const [voteResultMessage, setVoteResultMessage] = useState<string | null>(null);
  const announceRef = useRef<Audio.Sound | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(
    state.debateTimerMinutes * 60
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicRef = useRef<Audio.Sound | null>(null);

  // Start/stop debate music based on dayStep
  useEffect(() => {
    let mounted = true;

    async function startMusic() {
      try {
        const { sound } = await Audio.Sound.createAsync(DEBAT_MUSIC, {
          isLooping: true,
          volume: isMuted ? 0 : DEBAT_VOLUME,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        musicRef.current = sound;
        await sound.playAsync();
      } catch {
        // Ignore
      }
    }

    async function stopMusic() {
      try {
        if (musicRef.current) {
          await musicRef.current.stopAsync();
          await musicRef.current.unloadAsync();
          musicRef.current = null;
        }
      } catch {
        // Ignore
      }
    }

    if (dayStep === "debate") {
      startMusic();
    } else {
      stopMusic();
    }

    return () => {
      mounted = false;
      const s = musicRef.current;
      musicRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, [dayStep]);

  // Play random announcement (death or no-death)
  useEffect(() => {
    if (dayStep !== "announce") return;
    const hasDeath = state.nightDeaths.length > 0;
    const source = hasDeath ? ANNONCE_DEATH : ANNONCE_NO_DEATH;
    if (source.length === 0) return;
    let mounted = true;

    async function playAnnounce() {
      try {
        const { sound } = await Audio.Sound.createAsync(pickRandom(source));
        if (!mounted) { await sound.unloadAsync(); return; }
        announceRef.current = sound;
        await sound.playAsync();
      } catch { /* ignore */ }
    }

    playAnnounce();
    return () => {
      mounted = false;
      const s = announceRef.current;
      announceRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, [dayStep]);

  // Handle mute toggle
  useEffect(() => {
    musicRef.current?.setVolumeAsync(isMuted ? 0 : DEBAT_VOLUME);
  }, [isMuted]);

  useEffect(() => {
    if (dayStep === "debate" && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setDayStep("vote");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dayStep]);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Build enriched death announcements
  const buildDeathMessages = (): { key: string; text: string; isSpecial?: boolean }[] => {
    const messages: { key: string; text: string; isSpecial?: boolean }[] = [];

    for (const id of state.nightDeaths) {
      const player = state.players.find((p) => p.id === id);
      if (!player) continue;
      messages.push({ key: `dead-${id}`, text: `💀 ${player.name}` });

      // Lovers cascade: if this dead player is a lover, find the other
      if (state.lovers) {
        const [l1, l2] = state.lovers;
        let otherLoverId: string | null = null;
        if (id === l1) otherLoverId = l2;
        else if (id === l2) otherLoverId = l1;

        if (otherLoverId) {
          const otherLover = state.players.find((p) => p.id === otherLoverId);
          // Only show grief death if the other lover is not also in nightDeaths (avoid duplicate)
          if (otherLover && !state.nightDeaths.includes(otherLoverId)) {
            messages.push({
              key: `grief-${otherLoverId}`,
              text: `💔 ${otherLover.name} est mort(e) de chagrin`,
              isSpecial: true,
            });
          }
        }
      }
    }

    return messages;
  };

  // Elder survived with 1 life: elderLives < 2 and elder is still alive
  const elder = state.players.find((p) => p.role === "elder");
  const elderSurvivedAttack =
    elder?.isAlive && state.elderLives < 2 && state.nightDeaths.length > 0;

  const handleVote = (playerId: string) => {
    const votedPlayer = alivePlayers.find((p) => p.id === playerId);

    if (votedPlayer?.role === "village_idiot" && !state.villageIdiotRevealed) {
      dispatch({ type: "VOTE_ELIMINATE", playerId });
      // Reducer sets villageIdiotRevealed=true, does NOT change phase
      setVoteResultMessage(
        `🤪 ${votedPlayer.name} est l'Idiot du Village ! Il survit mais perd son droit de vote.`
      );
      setDayStep("vote_result");
    } else {
      dispatch({ type: "VOTE_ELIMINATE", playerId });
      // Reducer changes phase, useEffect navigates
    }
  };

  const handleIdiotContinue = () => {
    dispatch({ type: "START_NIGHT" });
    router.replace("/night");
  };

  useEffect(() => {
    if (dayStep === "vote_result") return; // Don't auto-navigate during vote_result
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "night") router.replace("/night");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase, dayStep]);

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const dayTitle = `Jour ${state.turn}`;

  const deathMessages = buildDeathMessages();
  const ravenMarkedPlayer = state.ravenTarget
    ? state.players.find((p) => p.id === state.ravenTarget)
    : null;

  if (dayStep === "debate") {
    return (
      <>
        <Stack.Screen
          options={{ title: dayTitle, headerShown: false }}
        />
        <ImageBackground
          source={require("../assets/debat-background.png")}
          style={styles.debatContainer}
          resizeMode="cover"
        >
          <Pressable
            style={styles.muteButton}
            onPress={() => setIsMuted((m) => !m)}
          >
            <Text style={styles.muteIcon}>{isMuted ? "🔇" : "🔊"}</Text>
          </Pressable>

          <Text style={styles.debatDayTitle}>{dayTitle}</Text>
          <Text style={styles.debatTimer}>{formatTime(secondsLeft)}</Text>

          <Pressable
            style={styles.skipButton}
            onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setDayStep("vote");
            }}
          >
            <Text style={styles.skipButtonText}>Passer au vote</Text>
          </Pressable>
        </ImageBackground>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: dayTitle, headerShown: false }}
      />
      <ImageBackground
        source={require("../assets/debat-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
        {dayStep === "announce" && (
          <View style={styles.centered}>
            <Text style={styles.title}>Le village se reveille</Text>
            {deathMessages.length === 0 ? (
              <Text style={styles.announcement}>
                Personne n'est mort cette nuit !
              </Text>
            ) : (
              <>
                <Text style={styles.announcement}>
                  Cette nuit, le village a perdu :
                </Text>
                {deathMessages.map((msg) => (
                  <Text
                    key={msg.key}
                    style={msg.isSpecial ? styles.griefName : styles.deadName}
                  >
                    {msg.text}
                  </Text>
                ))}
              </>
            )}
            {elderSurvivedAttack && (
              <Text style={styles.elderMessage}>
                L'Ancien a été attaqué mais résiste !
              </Text>
            )}
            {state.elderKilledByVillage && (
              <Text style={styles.warningMessage}>
                ⚠️ Les pouvoirs spéciaux du village sont perdus.
              </Text>
            )}
            <Pressable
              style={styles.button}
              onPress={() => {
                if (state.ravenTarget != null) {
                  setDayStep("raven_mark");
                } else {
                  setDayStep("debate");
                }
              }}
            >
              <Text style={styles.buttonText}>Lancer le debat</Text>
            </Pressable>
          </View>
        )}

        {dayStep === "raven_mark" && (
          <View style={styles.centered}>
            <Text style={styles.title}>🐦‍⬛ Un joueur porte la marque du Corbeau</Text>
            {ravenMarkedPlayer && (
              <Text style={styles.ravenMarkedName}>{ravenMarkedPlayer.name}</Text>
            )}
            <Text style={styles.announcement}>
              Il commence le vote avec 2 voix contre lui.
            </Text>
            <Pressable
              style={styles.button}
              onPress={() => setDayStep("debate")}
            >
              <Text style={styles.buttonText}>Lancer le débat</Text>
            </Pressable>
          </View>
        )}

        {dayStep === "vote" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>Vote du village</Text>
            <Text style={styles.instruction}>
              Qui le village elimine-t-il ?
            </Text>
            <FlatList
              data={alivePlayers}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.playerOption}
                  onPress={() => handleVote(item.id)}
                >
                  <View style={styles.playerOptionRow}>
                    <Text style={styles.playerOptionText}>{item.name}</Text>
                    {item.id === state.ravenTarget && (
                      <Text style={styles.ravenBadge}>(+2 voix)</Text>
                    )}
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {dayStep === "vote_result" && (
          <View style={styles.centered}>
            <Text style={styles.idiotMessage}>{voteResultMessage}</Text>
            <Pressable
              style={styles.button}
              onPress={handleIdiotContinue}
            >
              <Text style={styles.buttonText}>Continuer</Text>
            </Pressable>
          </View>
        )}
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  debatContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  debatDayTitle: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.white,
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  debatTimer: {
    fontFamily: fonts.cinzelBold,
    fontSize: 80,
    color: colors.white,
    fontVariant: ["tabular-nums"],
    marginBottom: 48,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fullContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 28,
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  announcement: {
    color: colors.white,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  deadName: {
    fontFamily: fonts.cinzelBold,
    color: "#ff6b6b",
    fontSize: 24,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  griefName: {
    fontFamily: fonts.cinzelBold,
    color: "#f472b6",
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  elderMessage: {
    color: "#fbbf24",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  warningMessage: {
    color: "#f87171",
    fontSize: 15,
    marginTop: 4,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ravenMarkedName: {
    fontFamily: fonts.cinzelBold,
    color: "#c084fc",
    fontSize: 32,
    marginVertical: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  idiotMessage: {
    color: colors.white,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stepTitle: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  instruction: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  list: {
    flex: 1,
  },
  playerOption: {
    backgroundColor: "rgba(22,33,62,0.8)",
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  playerOptionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
  },
  ravenBadge: {
    color: "#c084fc",
    fontSize: 14,
    marginLeft: 8,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.cinzelBold,
  },
  skipButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  muteButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  muteIcon: {
    fontSize: 22,
  },
});
