import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
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
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  skull: { fontSize: 64, marginBottom: spacing.base },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.textSecondary,
  },
  info: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
