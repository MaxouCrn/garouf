import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("window");

const PARTICLE_COUNT = 18;

interface ParticleConfig {
  startX: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

function createParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    startX: Math.random() * width,
    startY: height + Math.random() * 40,
    size: 2 + Math.random() * 4,
    duration: 6000 + Math.random() * 8000,
    delay: Math.random() * 5000,
    drift: -30 + Math.random() * 60,
    opacity: 0.3 + Math.random() * 0.5,
  }));
}

function Particle({ config }: { config: ParticleConfig }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      translateX.setValue(0);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -(height * 0.5 + Math.random() * height * 0.4),
          duration: config.duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: config.drift,
          duration: config.duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: config.opacity,
            duration: config.duration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: config.opacity,
            duration: config.duration * 0.5,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: config.duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };

    const timeout = setTimeout(animate, config.delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: config.startX,
          top: config.startY,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

const particles = createParticles();

export default function FogEffect() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((config, i) => (
        <Particle key={i} config={config} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    backgroundColor: "#D4A017",
    shadowColor: "#D4A017",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
