import { useEffect, useRef, useState } from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

interface GTimerProps {
  seconds: number;
  onExpire?: () => void;
  urgentThreshold?: number;
}

export default function GTimer({ seconds, onExpire, urgentThreshold = 5 }: GTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [seconds]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [seconds]);

  useEffect(() => {
    if (remaining <= urgentThreshold && remaining > 0) {
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
  }, [remaining <= urgentThreshold]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${minutes}:${secs.toString().padStart(2, "0")}`;
  const isUrgent = remaining <= urgentThreshold && remaining > 0;

  return (
    <Animated.Text
      style={[
        styles.timer,
        isUrgent && styles.urgent,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      {display}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 48,
    color: colors.text,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  urgent: {
    color: colors.danger,
  },
});
