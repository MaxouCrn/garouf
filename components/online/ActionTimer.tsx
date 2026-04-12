import { useState, useEffect, useRef } from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

interface ActionTimerProps {
  seconds: number;
  onExpire: () => void;
}

export default function ActionTimer({ seconds, onExpire }: ActionTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const isUrgent = remaining <= 5 && remaining > 0;

  useEffect(() => {
    if (isUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isUrgent]);

  return (
    <Animated.Text style={[styles.timer, isUrgent && styles.urgent, { transform: [{ scale: pulseAnim }] }]}>
      {remaining}s
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.accent,
    textAlign: "center",
    marginVertical: spacing.sm,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  urgent: {
    color: colors.danger,
  },
});
