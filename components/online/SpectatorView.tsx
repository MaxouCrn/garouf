import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import type { NightStep } from "../../game/nightEngine";

interface Props {
  phase: string;
  nightStep: NightStep | null;
}

export default function SpectatorView({ phase, nightStep }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.skull}>💀</Text>
      <Text style={styles.title}>Tu es elimine(e)</Text>
      <Text style={styles.info}>
        {phase === "night" ? `Nuit en cours${nightStep ? ` — ${nightStep}` : ""}` : "Jour en cours"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  skull: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.textSecondary },
  info: { fontSize: 16, color: colors.textMuted, marginTop: 12 },
});
