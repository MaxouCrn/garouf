import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";
import GBadge from "./GBadge";

type BadgeVariant = "host" | "alive" | "dead" | "wolf" | "raven" | "spectator";

interface GPlayerRowProps {
  name: string;
  avatarLetter: string;
  badge?: { text: string; variant: BadgeVariant };
  highlighted?: boolean;
  eliminated?: boolean;
}

export default function GPlayerRow({ name, avatarLetter, badge, highlighted, eliminated }: GPlayerRowProps) {
  return (
    <View style={[styles.row, highlighted && styles.highlighted, eliminated && styles.eliminated]}>
      <View style={[styles.avatar, highlighted && styles.avatarHighlighted]}>
        <Text style={[styles.avatarText, highlighted && styles.avatarTextHighlighted]}>
          {avatarLetter}
        </Text>
      </View>
      <Text style={[styles.name, eliminated && styles.nameEliminated]}>{name}</Text>
      {badge && <GBadge text={badge.text} variant={badge.variant} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: spacing.md,
    marginBottom: 5,
  },
  highlighted: {
    borderColor: colors.accentDim,
  },
  eliminated: {
    opacity: 0.5,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHighlighted: {
    backgroundColor: "rgba(126,184,218,0.12)",
  },
  avatarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.accent,
  },
  avatarTextHighlighted: {
    color: colors.accent,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  nameEliminated: {
    textDecorationLine: "line-through",
  },
});
