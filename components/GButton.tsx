import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii } from "../theme/spacing";

type Variant = "primary" | "outline" | "ghost" | "danger" | "warm";

interface GButtonProps {
  children: string;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle; loaderColor: string }> = {
  primary: {
    container: { backgroundColor: colors.accent },
    text: { color: colors.background },
    loaderColor: colors.background,
  },
  outline: {
    container: { backgroundColor: "rgba(8,12,20,0.5)", borderWidth: 1, borderColor: colors.accentDim },
    text: { color: colors.accent },
    loaderColor: colors.accent,
  },
  ghost: {
    container: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
    text: { color: colors.text },
    loaderColor: colors.text,
  },
  danger: {
    container: { backgroundColor: "rgba(8,12,20,0.5)", borderWidth: 1, borderColor: "rgba(232,93,93,0.2)" },
    text: { color: colors.danger },
    loaderColor: colors.danger,
  },
  warm: {
    container: { backgroundColor: colors.warm },
    text: { color: colors.background },
    loaderColor: colors.background,
  },
};

export default function GButton({ children, variant = "primary", disabled, loading, onPress, style }: GButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      style={[styles.base, v.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={v.loaderColor} />
      ) : (
        <Text style={[styles.text, v.text]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radii.base,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.4,
  },
});
