import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import type { NightStep } from "../../game/nightEngine";

const STEP_LABELS: Record<string, string> = {
  intro: "La nuit tombe sur le village...",
  cupid: "Cupidon ouvre les yeux...",
  lovers_reveal: "Les amoureux se decouvrent...",
  seer: "La Voyante ouvre les yeux...",
  savior: "Le Salvateur ouvre les yeux...",
  werewolves: "Les Loups-Garous ouvrent les yeux...",
  witch: "La Sorciere ouvre les yeux...",
  raven: "Le Corbeau ouvre les yeux...",
  little_girl: "La Petite Fille entrouvre les yeux...",
  resolution: "Le soleil se leve...",
};

interface Props {
  step: NightStep | null;
}

export default function NightWaitView({ step }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{step ? STEP_LABELS[step] || step : "..."}</Text>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
      <Text style={styles.hint}>En attente...</Text>
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
  text: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.text,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  spinner: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: colors.accentDim,
    borderTopColor: colors.accent,
    borderRadius: 16,
    marginTop: spacing.xl,
  },
  hint: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
