import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import GButton from "../GButton";

interface Props {
  winner: "werewolves" | "villagers" | "lovers" | null;
}

const WINNER_CONFIG = {
  werewolves: {
    emoji: "🐺",
    text: "Les Loups-Garous ont devore le village !",
    color: colors.danger,
  },
  villagers: {
    emoji: "🏘️",
    text: "Le village a triomphe des loups !",
    color: colors.success,
  },
  lovers: {
    emoji: "💕",
    text: "Les Amoureux ont survecu ensemble !",
    color: colors.warm,
  },
};

export default function EndView({ winner }: Props) {
  const router = useRouter();
  const config = winner ? WINNER_CONFIG[winner] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Fin de la partie</Text>
      {config && <Text style={styles.emoji}>{config.emoji}</Text>}
      <Text style={[styles.result, config && { color: config.color }]}>
        {config ? config.text : "Match nul"}
      </Text>
      <GButton variant="primary" onPress={() => router.replace("/")}>
        Retour a l'accueil
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
  subtitle: {
    fontFamily: fonts.displayRegular,
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: spacing.base,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.base,
  },
  result: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
});
