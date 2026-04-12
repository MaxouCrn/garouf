import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import GButton from "../GButton";
import GCardFrame from "../GCardFrame";

interface Props {
  clueNames: string[];
  onDone: () => void;
  timerSeconds: number;
}

export default function LittleGirlView({ clueNames, onDone, timerSeconds }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>La Petite Fille</Text>
      <Text style={styles.instruction}>Tu apercois des silhouettes dans la nuit...</Text>
      <ActionTimer seconds={timerSeconds} onExpire={onDone} />
      <GCardFrame variant="glass" corners style={styles.clueCard}>
        {clueNames.map((name, idx) => (
          <View key={idx} style={styles.clueRow}>
            <Text style={styles.wolfEmoji}>🐺</Text>
            <Text style={styles.clueName}>{name}</Text>
          </View>
        ))}
      </GCardFrame>
      <GButton variant="ghost" onPress={onDone} style={{ width: "100%", marginTop: spacing.xl }}>
        Fermer les yeux
      </GButton>
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
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  instruction: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  clueCard: {
    width: "100%",
    marginVertical: spacing.lg,
  },
  clueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: spacing.sm,
  },
  wolfEmoji: {
    fontSize: 20,
  },
  clueName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
