import { View, Text, Image, Pressable, ImageSourcePropType, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

interface GRoleCardProps {
  image: ImageSourcePropType;
  name: string;
  count: number;
  cardWidth: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function GRoleCard({ image, name, count, cardWidth, onIncrement, onDecrement }: GRoleCardProps) {
  const active = count > 0;
  const imageWidth = cardWidth - 12; // card padding (6px each side)
  const imageHeight = imageWidth * 1.5; // 2:3 ratio

  return (
    <View style={[styles.card, { width: cardWidth }, active && styles.cardActive]}>
      <Image source={image} style={{ width: imageWidth, height: imageHeight, borderRadius: radii.sm, marginBottom: spacing.sm }} resizeMode="cover" />
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <View style={styles.counter}>
        <Pressable style={styles.counterBtn} onPress={onDecrement}>
          <Text style={styles.counterBtnText}>-</Text>
        </Pressable>
        <Text style={[styles.counterVal, !active && styles.counterValZero]}>
          {count}
        </Text>
        <Pressable style={styles.counterBtn} onPress={onIncrement}>
          <Text style={styles.counterBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: 6,
    paddingBottom: spacing.sm,
  },
  cardActive: {
    borderColor: colors.accent,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 13,
    marginBottom: spacing.sm,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterBtn: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 17,
  },
  counterVal: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    minWidth: 14,
    textAlign: "center",
  },
  counterValZero: {
    color: colors.textMuted,
  },
});
