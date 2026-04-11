import { ReactNode } from "react";
import { View, ImageBackground, ImageSourcePropType, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface GScreenBgProps {
  source: ImageSourcePropType;
  children: ReactNode;
  overlayOpacity?: [number, number, number];
  padHorizontal?: boolean;
}

export default function GScreenBg({
  source,
  children,
  overlayOpacity = [0.3, 0.15, 0.5],
  padHorizontal = true,
}: GScreenBgProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={source} style={styles.bg} resizeMode="cover">
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: `rgba(10,14,22,${Math.max(...overlayOpacity)})`,
          },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.base,
            paddingBottom: insets.bottom + spacing.base,
            paddingHorizontal: padHorizontal ? spacing.lg : 0,
          },
        ]}
      >
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
});
