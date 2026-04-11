import { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, Animated, Easing, ImageSourcePropType, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

type PotionVariant = "life" | "death";

interface GPotionCardProps {
  image: ImageSourcePropType;
  title: string;
  variant: PotionVariant;
  available: boolean;
  active: boolean;
  activeLabel?: string;
  onPress: () => void;
  actionLabel: string;
}

const variantColors: Record<PotionVariant, { bg: string; border: string; activeBg: string; activeText: string }> = {
  life: {
    bg: "rgba(232,93,93,0.08)",
    border: "rgba(232,93,93,0.25)",
    activeBg: "rgba(232,93,93,0.2)",
    activeText: colors.danger,
  },
  death: {
    bg: "rgba(93,217,166,0.08)",
    border: "rgba(93,217,166,0.25)",
    activeBg: "rgba(93,217,166,0.2)",
    activeText: colors.success,
  },
};

export default function GPotionCard({
  image,
  title,
  variant,
  available,
  active,
  activeLabel,
  onPress,
  actionLabel,
}: GPotionCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const vc = variantColors[variant];

  useEffect(() => {
    if (available && !active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [available, active]);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: vc.bg, borderColor: vc.border },
        !available && styles.depleted,
        available && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Image source={image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>

      {!available ? (
        <View style={styles.depletedBadge}>
          <Text style={styles.depletedText}>Epuisee</Text>
        </View>
      ) : active ? (
        <Pressable
          style={[styles.actionBtn, { backgroundColor: vc.activeBg, borderColor: vc.activeText, borderWidth: 1.5 }]}
          onPress={onPress}
        >
          <Text style={[styles.actionBtnText, { color: vc.activeText }]}>
            {activeLabel || actionLabel}
          </Text>
          <Text style={[styles.undoHint, { color: vc.activeText }]}>Appuyer pour annuler</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.actionBtn} onPress={onPress}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.base,
    borderWidth: 1,
    padding: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  depleted: {
    opacity: 0.4,
  },
  image: {
    width: 64,
    height: 80,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.white,
    marginBottom: spacing.md,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.base,
    width: "100%",
    alignItems: "center",
    minHeight: 42,
    justifyContent: "center",
  },
  actionBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
    textAlign: "center",
  },
  undoHint: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
    opacity: 0.7,
  },
  depletedBadge: {
    backgroundColor: "rgba(100,100,100,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  depletedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
});
