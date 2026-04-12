import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import type { GamePausedPayload } from "../../types/online";

interface Props {
  info: GamePausedPayload;
}

export default function PausedView({ info }: Props) {
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
      <Text style={styles.title}>Partie en pause</Text>
      <Text style={styles.reason}>{info.disconnectedPlayer} a perdu la connexion</Text>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
      <Text style={styles.timer}>Reprise dans {info.resumeIn}s...</Text>
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
    fontSize: 24,
    color: colors.warm,
    marginBottom: spacing.base,
  },
  reason: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  spinner: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: colors.warmDim,
    borderTopColor: colors.warm,
    borderRadius: 16,
    marginBottom: spacing.base,
  },
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.accent,
  },
});
