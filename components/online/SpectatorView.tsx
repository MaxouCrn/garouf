import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing, radii } from "../../theme/spacing";
import { ROLE_REGISTRY, type Role } from "../../game/roles";
import type { NightStep } from "../../game/nightEngine";

const BACK_CARD = require("../../assets/cards/back-card.png");

interface Props {
  phase: string;
  nightStep: NightStep | null;
  role?: Role;
}

export default function SpectatorView({ phase, nightStep, role }: Props) {
  const cardSource = role && ROLE_REGISTRY[role]?.cardImage
    ? ROLE_REGISTRY[role].cardImage
    : BACK_CARD;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={cardSource}
          style={styles.card}
          contentFit="contain"
        />
      </View>
      <Text style={styles.title}>Tu es elimine(e)</Text>
      {role && (
        <Text style={styles.roleInfo}>
          Tu avais le role : <Text style={styles.roleName}>{ROLE_REGISTRY[role].label}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  imageWrapper: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  card: {
    width: 220,
    height: 320,
    filter: "grayscale(1)",
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.white,
  },
  roleInfo: {
    fontFamily: fonts.bodyRegular,
    fontSize: 20,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  roleName: {
    fontFamily: fonts.displayBold,
    color: colors.accent,
  },
});
