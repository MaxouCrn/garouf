import { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.65;
const ANIMATION_DURATION = 800;
const HOLD_DURATION = 700;

export default function SplashAnimationScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  const navigateHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(
      1,
      {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      },
      () => {
        // After animation completes, wait then navigate
        runOnJS(setTimeout)(() => runOnJS(navigateHome)(), HOLD_DURATION);
      }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
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
