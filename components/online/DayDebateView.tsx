import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { TimerStartPayload } from "../../types/online";

interface Props {
  timer: TimerStartPayload | null;
  isHost: boolean;
  onStartVote: () => void;
}

export default function DayDebateView({ timer, isHost, onStartVote }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!timer) return;
    const update = () => {
      const elapsed = Date.now() - timer.startedAt;
      const left = Math.max(0, Math.ceil((timer.durationMs - elapsed) / 1000));
      setRemaining(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isOver = remaining === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debat en cours</Text>
      <Text style={[styles.timer, isOver && styles.timerOver]}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>
      {!isOver && (
        <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
      )}
      {isOver && isHost && (
        <Pressable style={styles.button} onPress={onStartVote}>
          <Text style={styles.buttonText}>Passer au vote</Text>
        </Pressable>
      )}
      {isOver && !isHost && (
        <Text style={styles.waiting}>En attente du vote...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  timer: { fontSize: 64, fontWeight: "bold", color: colors.text },
  timerOver: { color: colors.danger },
  hint: { fontSize: 16, color: colors.textSecondary, marginTop: 24 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
  waiting: { fontSize: 16, color: colors.textSecondary, marginTop: 32, textAlign: "center" },
});
