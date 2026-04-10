import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { TimerStartPayload } from "../../types/online";

interface Props {
  timer: TimerStartPayload | null;
}

export default function DayDebateView({ timer }: Props) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debat en cours</Text>
      <Text style={styles.timer}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>
      <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  timer: { fontSize: 64, fontWeight: "bold", color: colors.text },
  hint: { fontSize: 16, color: colors.textSecondary, marginTop: 24 },
});
