import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

interface FogLayerConfig {
  duration: number;
  top: string;
  opacity: number;
  height: number;
  reverse?: boolean;
}

const FOG_LAYERS: FogLayerConfig[] = [
  { duration: 12000, top: "62%", opacity: 0.15, height: 120 },
  { duration: 18000, top: "68%", opacity: 0.1, height: 100, reverse: true },
  { duration: 15000, top: "75%", opacity: 0.12, height: 80 },
  { duration: 20000, top: "55%", opacity: 0.08, height: 140, reverse: true },
];

function FogLayer({ config }: { config: FogLayerConfig }) {
  const translateX = useRef(new Animated.Value(config.reverse ? 0 : -width)).current;
  const fadeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeOpacity, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Drift loop
    const drift = () => {
      translateX.setValue(config.reverse ? 0 : -width);
      Animated.timing(translateX, {
        toValue: config.reverse ? -width : 0,
        duration: config.duration,
        useNativeDriver: true,
      }).start(() => drift());
    };
    drift();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fogLayer,
        {
          top: config.top as any,
          height: config.height,
          opacity: fadeOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, config.opacity],
          }),
          transform: [{ translateX }],
        },
      ]}
    />
  );
}

export default function FogEffect() {
  return (
    <>
      {FOG_LAYERS.map((config, i) => (
        <FogLayer key={i} config={config} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  fogLayer: {
    position: "absolute",
    left: -width * 0.5,
    width: width * 2.5,
    borderRadius: 100,
    backgroundColor: "rgba(200, 210, 220, 1)",
  },
});
