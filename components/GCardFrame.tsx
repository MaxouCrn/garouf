import { ReactNode } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

type Variant = "solid" | "glass";

interface GCardFrameProps {
  children: ReactNode;
  variant?: Variant;
  corners?: boolean;
  cornerColor?: string;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

function CornerAccent({ position, color }: { position: "topLeft" | "bottomRight"; color?: string }) {
  const isTop = position === "topLeft";
  const borderClr = color || colors.accent;
  return (
    <View
      style={[
        styles.corner,
        isTop
          ? { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2, borderColor: borderClr }
          : { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2, borderColor: borderClr },
      ]}
    />
  );
}

export default function GCardFrame({
  children,
  variant = "solid",
  corners = true,
  cornerColor,
  title,
  subtitle,
  style,
}: GCardFrameProps) {
  const isGlass = variant === "glass";

  return (
    <View
      style={[
        styles.card,
        isGlass ? styles.glass : styles.solid,
        style,
      ]}
    >
      {corners && <CornerAccent position="topLeft" color={cornerColor} />}
      {corners && <CornerAccent position="bottomRight" color={cornerColor} />}

      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.separator} />
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.base,
    padding: spacing.lg,
    borderWidth: 1,
  },
  solid: {
    backgroundColor: colors.background,
    borderColor: colors.surfaceBorder,
  },
  glass: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.15,
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
});
