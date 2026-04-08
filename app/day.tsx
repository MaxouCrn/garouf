import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

type DayStep = "announce" | "debate" | "vote";

export default function DayScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [dayStep, setDayStep] = useState<DayStep>("announce");
  const [secondsLeft, setSecondsLeft] = useState(
    state.debateTimerMinutes * 60
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // After VOTE_ELIMINATE, phase changes — navigate
  if (state.phase === "hunter") {
    router.replace("/hunter");
    return null;
  }
  if (state.phase === "night") {
    router.replace("/night");
    return null;
  }
  if (state.phase === "end") {
    router.replace("/end");
    return null;
  }

  const alivePlayers = state.players.filter((p) => p.isAlive);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: `Jour ${state.turn}`, headerBackVisible: false }}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullContainer: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
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
    color: colors.danger,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  timer: {
    color: colors.warning,
    fontSize: 72,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
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
    color: colors.white,
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
});
