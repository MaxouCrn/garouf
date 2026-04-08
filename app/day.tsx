import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Audio } from "expo-av";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

const DEBAT_MUSIC = require("../assets/sounds/debat-music.mp3");
const DEBAT_VOLUME = 0.4;

type DayStep = "announce" | "debate" | "vote";

export default function DayScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [dayStep, setDayStep] = useState<DayStep>("announce");
  const [isMuted, setIsMuted] = useState(false);
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

  return (
    <>
      <Stack.Screen
        options={{ title: dayTitle, headerBackVisible: false }}
      />
      <CardFrame title={dayTitle}>
        {dayStep === "announce" && (
          <View style={styles.centered}>
            <Text style={styles.emoji}>☀️</Text>
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

        {dayStep === "debate" && (
          <View style={styles.centered}>
            <Pressable
              style={styles.muteButton}
              onPress={() => setIsMuted((m) => !m)}
            >
              <Text style={styles.muteIcon}>{isMuted ? "🔇" : "🔊"}</Text>
            </Pressable>
            <Text style={styles.title}>Debat en cours</Text>
            <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.subtitle}>
              Les villageois debattent...
            </Text>
            <Pressable
              style={styles.skipButton}
              onPress={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setDayStep("vote");
              }}
            >
              <Text style={styles.skipButtonText}>Passer au vote</Text>
            </Pressable>
          </View>
        )}

        {dayStep === "vote" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>🗳️ Vote du village</Text>
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
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 28,
    marginBottom: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 32,
  },
  announcement: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  deadName: {
    fontFamily: fonts.cinzelBold,
    color: colors.danger,
    fontSize: 24,
    marginBottom: 8,
  },
  timer: {
    fontFamily: fonts.cinzelBold,
    color: colors.ember,
    fontSize: 72,
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  playerOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
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
