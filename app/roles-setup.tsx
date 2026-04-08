import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";
import CardFrame from "../components/CardFrame";

interface RoleConfig {
  role: Role;
  label: string;
  emoji: string;
  description: string;
  min: number;
  max: number;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: "werewolf",
    label: "Loup-Garou",
    emoji: "🐺",
    description: "Se reveille la nuit pour eliminer un villageois",
    min: 1,
    max: 4,
  },
  {
    role: "seer",
    label: "Voyante",
    emoji: "🔮",
    description: "Peut voir le role d'un joueur chaque nuit",
    min: 0,
    max: 1,
  },
  {
    role: "witch",
    label: "Sorciere",
    emoji: "🧪",
    description: "Potion de vie et potion de mort",
    min: 0,
    max: 1,
  },
  {
    role: "hunter",
    label: "Chasseur",
    emoji: "🏹",
    description: "Emporte un joueur en mourant",
    min: 0,
    max: 1,
  },
];

const TIMER_OPTIONS = [1, 2, 3, 4, 5];

export default function RolesSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const playerCount = state.players.length;

  const [counts, setCounts] = useState<Record<Role, number>>({
    werewolf: 2,
    villager: 0,
    seer: 1,
    witch: 1,
    hunter: 1,
  });

  const specialCount = ROLE_CONFIGS.reduce(
    (sum, rc) => sum + (counts[rc.role] || 0),
    0
  );
  const villagerCount = playerCount - specialCount;
  const isValid = villagerCount >= 0 && counts.werewolf >= 1;

  const updateCount = (role: Role, delta: number) => {
    const config = ROLE_CONFIGS.find((rc) => rc.role === role)!;
    const newVal = Math.max(config.min, Math.min(config.max, counts[role] + delta));
    setCounts({ ...counts, [role]: newVal });
  };

  const handleStart = () => {
    const roles: { role: Role; count: number }[] = [
      ...ROLE_CONFIGS.map((rc) => ({ role: rc.role, count: counts[rc.role] })),
      { role: "villager" as Role, count: villagerCount },
    ];
    dispatch({ type: "SET_ROLES", roles });
    dispatch({ type: "START_DISTRIBUTION" });
    router.push("/distribution");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Roles" }} />
      <CardFrame title="Roles" subtitle={`${playerCount} joueurs`}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {ROLE_CONFIGS.map((rc) => (
            <View key={rc.role} style={styles.roleRow}>
              <View style={styles.roleInfo}>
                <Text style={styles.roleLabel}>
                  {rc.emoji} {rc.label}
                </Text>
                <Text style={styles.roleDesc}>{rc.description}</Text>
              </View>
              <View style={styles.counter}>
                <Pressable
                  onPress={() => updateCount(rc.role, -1)}
                  style={styles.counterBtn}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={styles.counterValue}>{counts[rc.role]}</Text>
                <Pressable
                  onPress={() => updateCount(rc.role, 1)}
                  style={styles.counterBtn}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View style={styles.villagerRow}>
            <Text style={styles.roleLabel}>🧑‍🌾 Villageois</Text>
            <Text
              style={[
                styles.villagerCount,
                villagerCount < 0 && styles.errorText,
              ]}
            >
              {villagerCount < 0 ? `${villagerCount} (trop de roles!)` : villagerCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.timerTitle}>Timer de debat</Text>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((min) => (
              <Pressable
                key={min}
                style={[
                  styles.timerOption,
                  state.debateTimerMinutes === min && styles.timerOptionActive,
                ]}
                onPress={() => dispatch({ type: "SET_TIMER", minutes: min })}
              >
                <Text
                  style={[
                    styles.timerOptionText,
                    state.debateTimerMinutes === min && styles.timerOptionTextActive,
                  ]}
                >
                  {min} min
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.startButton, !isValid && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={!isValid}
          >
            <Text style={styles.startButtonText}>Distribuer les roles</Text>
          </Pressable>
        </ScrollView>
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  roleInfo: {
    flex: 1,
    marginRight: 12,
  },
  roleLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  roleDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  counterBtn: {
    backgroundColor: colors.surfaceLight,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },
  counterValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  villagerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  villagerCount: {
    color: colors.success,
    fontSize: 20,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceLight,
    marginVertical: 16,
  },
  timerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  timerOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  timerOptionActive: {
    backgroundColor: colors.primary,
  },
  timerOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  timerOptionTextActive: {
    color: colors.black,
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  startButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
