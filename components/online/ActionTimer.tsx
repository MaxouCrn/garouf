import { useState, useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface ActionTimerProps {
  seconds: number;
  onExpire: () => void;
}

export default function ActionTimer({ seconds, onExpire }: ActionTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

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

  const isUrgent = remaining <= 5;

  return (
    <Text style={[styles.timer, isUrgent && styles.urgent]}>
      {remaining}s
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginVertical: 8,
  },
  urgent: {
    color: colors.danger,
  },
});
