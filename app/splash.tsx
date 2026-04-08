import { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.65;
const ANIMATION_DURATION = 800;
const HOLD_DURATION = 700;

export default function SplashAnimationScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        router.replace("/");
      }, HOLD_DURATION);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require("../assets/logo-app.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
