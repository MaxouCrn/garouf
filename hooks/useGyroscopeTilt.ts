import { useRef, useEffect } from "react";
import { Animated, Platform } from "react-native";
import { DeviceMotion } from "expo-sensors";

const TILT_INTENSITY = 12;
const TILT_DAMPING = 0.15;

export function useGyroscopeTilt(active: boolean) {
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const currentY = useRef(0);
  const baselineBeta = useRef<number | null>(null);
  const baselineGamma = useRef<number | null>(null);

  useEffect(() => {
    if (!active || Platform.OS === "web") {
      tiltX.setValue(0);
      tiltY.setValue(0);
      baselineBeta.current = null;
      baselineGamma.current = null;
      return;
    }

    DeviceMotion.setUpdateInterval(32);

    const subscription = DeviceMotion.addListener((data) => {
      if (!data.rotation) return;
      const { beta, gamma } = data.rotation;

      if (baselineBeta.current === null) {
        baselineBeta.current = beta;
        baselineGamma.current = gamma;
        return;
      }

      const deltaGamma = gamma - (baselineGamma.current ?? 0);
      const deltaBeta = beta - (baselineBeta.current ?? 0);

      const targetX = Math.max(-1, Math.min(1, deltaGamma * 2.5)) * TILT_INTENSITY;
      const targetY = Math.max(-1, Math.min(1, deltaBeta * 2.5)) * TILT_INTENSITY;

      currentX.current += (targetX - currentX.current) * TILT_DAMPING;
      currentY.current += (targetY - currentY.current) * TILT_DAMPING;

      tiltX.setValue(currentX.current);
      tiltY.setValue(-currentY.current);
    });

    return () => {
      subscription.remove();
      tiltX.setValue(0);
      tiltY.setValue(0);
      currentX.current = 0;
      currentY.current = 0;
      baselineBeta.current = null;
      baselineGamma.current = null;
    };
  }, [active]);

  return { tiltX, tiltY, TILT_INTENSITY };
}
