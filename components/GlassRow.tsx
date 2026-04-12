import { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { radii, spacing } from "../theme/spacing";
import { colors } from "../theme/colors";

interface GlassRowProps {
  selected?: boolean;
  selectedColor?: string;
  onPress?: () => void;
  children: ReactNode;
  style?: ViewStyle;
}

export default function GlassRow({ selected, selectedColor = colors.accent, onPress, children, style }: GlassRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.wrapper,
        selected && { borderColor: selectedColor },
        style,
      ]}
    >
      <BlurView
        intensity={60}
        tint="dark"
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.overlay,
          selected && { backgroundColor: selectedColor + "1F" },
        ]}
      />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.base,
    padding: spacing.base,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  overlay: {
    backgroundColor: "rgba(10,14,22,0.45)",
  },
});
