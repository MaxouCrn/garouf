import { Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii } from "../theme/spacing";

type BadgeVariant = "host" | "alive" | "dead" | "wolf" | "raven" | "spectator";

interface GBadgeProps {
  text: string;
  variant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  host: {
    container: { backgroundColor: "rgba(232,168,73,0.08)" },
    text: { color: colors.warm },
  },
  alive: {
    container: { backgroundColor: "rgba(93,217,166,0.08)" },
    text: { color: colors.success },
  },
  dead: {
    container: { backgroundColor: "rgba(232,93,93,0.08)" },
    text: { color: colors.danger },
  },
  wolf: {
    container: { backgroundColor: "rgba(232,93,93,0.08)" },
    text: { color: colors.danger },
  },
  raven: {
    container: { backgroundColor: "rgba(192,132,252,0.08)" },
    text: { color: "#c084fc" },
  },
  spectator: {
    container: { backgroundColor: "rgba(255,255,255,0.06)" },
    text: { color: colors.textSecondary },
  },
};

export default function GBadge({ text, variant }: GBadgeProps) {
  const v = variantStyles[variant];
  return (
    <Text style={[styles.badge, v.container, v.text]}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
});
