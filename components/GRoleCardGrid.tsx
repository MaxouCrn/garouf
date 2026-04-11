import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";
import { ROLE_REGISTRY, type Role } from "../game/roles";
import { ROLE_CARDS } from "../theme/roleCards";
import GRoleCard from "./GRoleCard";

const BACK_CARD = require("../assets/cards/back-card.png");

interface GRoleCardGridProps {
  roleConfig: Record<Role, number>;
  totalPlayers: number;
  onAdjust: (role: Role, delta: number) => void;
  onPreset?: () => void;
}

const ROLE_ORDER: Role[] = [
  "werewolf", "seer", "witch", "hunter", "villager",
  "cupid", "savior", "little_girl", "elder", "raven", "village_idiot",
];

export default function GRoleCardGrid({ roleConfig, totalPlayers, onAdjust, onPreset }: GRoleCardGridProps) {
  const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);
  const isMismatch = totalRoles !== totalPlayers && totalPlayers > 0;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Roles</Text>
        <Text style={[styles.counter, isMismatch && styles.counterMismatch]}>
          {totalRoles} / {totalPlayers}
        </Text>
      </View>

      {isMismatch && (
        <Text style={styles.warning}>
          Ajuste les roles pour correspondre aux {totalPlayers} joueurs
        </Text>
      )}

      {onPreset && (
        <Pressable style={styles.presetBtn} onPress={onPreset}>
          <Text style={styles.presetBtnText}>Preset auto</Text>
        </Pressable>
      )}

      <View style={styles.grid}>
        {ROLE_ORDER.map((role) => {
          const def = ROLE_REGISTRY[role];
          const image = ROLE_CARDS[role] || BACK_CARD;
          return (
            <GRoleCard
              key={role}
              image={image}
              name={def.label}
              count={roleConfig[role]}
              onIncrement={() => onAdjust(role, 1)}
              onDecrement={() => onAdjust(role, -1)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  counter: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.accent,
  },
  counterMismatch: {
    color: colors.warm,
  },
  warning: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.warm,
    marginBottom: spacing.sm,
  },
  presetBtn: {
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: "rgba(126,184,218,0.15)",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  presetBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
