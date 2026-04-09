import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, ImageBackground, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Audio } from "expo-av";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const DEBAT_MUSIC = require("../assets/sounds/debat-music.mp3");
const DEBAT_VOLUME = 0.4;

// Library of no-death announcements — add new require() entries here when adding files
const ANNONCE_NO_DEATH = [
  require("../assets/sounds/narrator/day/no-death/annonce-no-death-1.mp3"),
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type DayStep = "announce" | "debate" | "vote";

export default function DayScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [dayStep, setDayStep] = useState<DayStep>("announce");
  const [isMuted, setIsMuted] = useState(false);
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

  // Play random no-death announcement
  useEffect(() => {
    if (dayStep !== "announce" || state.nightDeaths.length > 0) return;
    let mounted = true;

    async function playAnnounce() {
      try {
        const { sound } = await Audio.Sound.createAsync(pickRandom(ANNONCE_NO_DEATH));
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

  const deadNames = state.nightDeaths
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const handleVote = (playerId: string) => {
    dispatch({ type: "VOTE_ELIMINATE", playerId });
  };

  useEffect(() => {
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "night") router.replace("/night");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const dayTitle = `Jour ${state.turn}`;

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
            {deadNames.length === 0 ? (
              <Text style={styles.announcement}>
                Personne n'est mort cette nuit !
              </Text>
            ) : (
              <>
                <Text style={styles.announcement}>
                  Cette nuit, le village a perdu :
                </Text>
                {deadNames.map((name) => (
                  <Text key={name} style={styles.deadName}>
                    💀 {name}
                  </Text>
                ))}
              </>
            )}
            <Pressable
              style={styles.button}
              onPress={() => setDayStep("debate")}
            >
              <Text style={styles.buttonText}>Lancer le debat</Text>
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
                  <Text style={styles.playerOptionText}>{item.name}</Text>
                </Pressable>
              )}
            />
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
  playerOptionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
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
