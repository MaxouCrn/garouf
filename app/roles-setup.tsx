import { useState } from "react";
import { View, Text, Pressable, ScrollView, ImageBackground, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import MuteButton from "../components/MuteButton";
import { useMusicContext } from "../context/MusicContext";
import { getPreset, getBalanceWarnings } from "../game/balance";
import { ROLE_REGISTRY } from "../game/roles";
import type { Role } from "../game/roles";

const TIMER_OPTIONS = [1, 2, 3, 4, 5];

const WEREWOLF_ROLES: Role[] = ["werewolf"];
const SPECIAL_ROLES: Role[] = [
  "seer",
  "witch",
  "hunter",
  "cupid",
  "little_girl",
  "savior",
  "elder",
  "raven",
  "village_idiot",
];

export default function RolesSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { stopMusic } = useMusicContext();
  const playerCount = state.players.length;

  const [counts, setCounts] = useState<Record<Role, number>>(
    () => getPreset(playerCount)
  );

  const nonVillagerCount = [...WEREWOLF_ROLES, ...SPECIAL_ROLES].reduce(
    (sum, role) => sum + (counts[role] || 0),
    0
  );
  const villagerCount = playerCount - nonVillagerCount;
  const isValid = villagerCount >= 0 && counts.werewolf >= 1;

  const balanceWarnings = getBalanceWarnings(playerCount, {
    ...counts,
    villager: villagerCount,
  });

  const updateCount = (role: Role, delta: number) => {
    const def = ROLE_REGISTRY[role];
    const newVal = Math.max(def.min, Math.min(def.max, (counts[role] || 0) + delta));
    setCounts({ ...counts, [role]: newVal });
  };

  const getShortDescription = (description: string): string => {
    const firstSentence = description.split(".")[0];
    return firstSentence.length > 0 ? firstSentence + "." : description;
  };

  const handleStart = () => {
    stopMusic();
    const allRoles: Role[] = ["werewolf", ...SPECIAL_ROLES, "villager"];
    const roles = allRoles.map((role) => ({
      role,
      count: role === "villager" ? villagerCount : counts[role],
    }));
    dispatch({ type: "SET_ROLES", roles });
    dispatch({ type: "START_DISTRIBUTION" });
    router.push("/distribution");
  };

  const renderRoleRow = (role: Role) => {
    const def = ROLE_REGISTRY[role];
    return (
      <View key={role} style={styles.roleRow}>
        <View style={styles.roleInfo}>
          <Text style={styles.roleLabel}>
            {def.emoji} {def.label}
          </Text>
          <Text style={styles.roleDesc}>{getShortDescription(def.description)}</Text>
        </View>
        <View style={styles.counter}>
          <Pressable
            onPress={() => updateCount(role, -1)}
            style={styles.counterBtn}
          >
            <Text style={styles.counterBtnText}>−</Text>
          </Pressable>
          <Text style={styles.counterValue}>{counts[role]}</Text>
          <Pressable
            onPress={() => updateCount(role, 1)}
            style={styles.counterBtn}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Roles", headerShown: false }} />
      <ImageBackground
        source={require("../assets/inscription-joueur-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <MuteButton />

        <Text style={styles.title}>Roles</Text>
        <Text style={styles.subtitle}>{playerCount} joueurs</Text>

        <View style={styles.presetBadge}>
          <Text style={styles.presetBadgeText}>
            Composition recommandée pour {playerCount} joueurs
          </Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeaderDanger}>Loups-Garous</Text>
          {WEREWOLF_ROLES.map(renderRoleRow)}

          <Text style={styles.sectionHeaderGold}>Rôles spéciaux</Text>
          {SPECIAL_ROLES.map(renderRoleRow)}

          <View style={styles.villagerRow}>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>
                {ROLE_REGISTRY.villager.emoji} {ROLE_REGISTRY.villager.label}
              </Text>
              <Text style={styles.roleDesc}>
                {getShortDescription(ROLE_REGISTRY.villager.description)}
              </Text>
            </View>
            <Text
              style={[
                styles.villagerCount,
                villagerCount < 0 && styles.errorText,
              ]}
            >
              {villagerCount < 0 ? `${villagerCount} (trop de roles!)` : villagerCount}
            </Text>
          </View>

          {balanceWarnings.length > 0 && (
            <View style={styles.warningZone}>
              {balanceWarnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Text>
              ))}
            </View>
          )}

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
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.white,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  presetBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(212,160,23,0.2)",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  presetBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  sectionHeaderDanger: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sectionHeaderGold: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(22,33,62,0.85)",
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
    backgroundColor: "rgba(15,52,96,0.9)",
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
    backgroundColor: "rgba(22,33,62,0.85)",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    marginTop: 12,
  },
  villagerCount: {
    color: colors.success,
    fontSize: 20,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.danger,
  },
  warningZone: {
    backgroundColor: "rgba(232,124,42,0.15)",
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  warningText: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 16,
  },
  timerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: "rgba(22,33,62,0.85)",
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
