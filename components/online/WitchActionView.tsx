import { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ActionTimer from "./ActionTimer";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function WitchActionView({ action, onSubmit }: Props) {
  const [heal, setHeal] = useState(false);
  const [killTargetId, setKillTargetId] = useState<string | null>(null);
  const [showPoisonTargets, setShowPoisonTargets] = useState(false);

  const werewolfTarget = action.werewolfTarget ?? null;
  const lifeAvailable = action.potions?.life ?? false;
  const deathAvailable = action.potions?.death ?? false;

  const selectedVictimName = killTargetId
    ? action.targets.find((t) => t.id === killTargetId)?.name
    : null;

  const hasAction = heal || killTargetId;

  const handleSubmit = (healOverride?: boolean, killOverride?: string | null) => {
    onSubmit("witch_action", {
      heal: healOverride !== undefined ? healOverride : heal,
      killTargetId: killOverride !== undefined ? killOverride : killTargetId,
    });
  };

  const handleTimeout = () => {
    onSubmit("witch_action", { heal: false, killTargetId: null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>La Sorciere</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />

      {/* Victim announcement */}
      <View style={styles.victimBanner}>
        <Text style={styles.victimIcon}>💀</Text>
        {werewolfTarget ? (
          <>
            <Text style={styles.victimLabel}>Victime des loups</Text>
            <Text style={styles.victimName}>{werewolfTarget.name}</Text>
          </>
        ) : (
          <Text style={styles.victimLabel}>Aucune victime cette nuit</Text>
        )}
      </View>

      {/* Potion cards */}
      <View style={styles.potionsRow}>
        {/* Life Potion Card */}
        <View style={[
          styles.potionCard,
          styles.potionCardLife,
          !lifeAvailable && styles.potionCardDepleted,
        ]}>
          <Image source={require("../../assets/health-potion.png")} style={styles.potionImage} resizeMode="contain" />
          <Text style={styles.potionTitle}>Vie</Text>

          {!lifeAvailable ? (
            <View style={styles.depletedBadge}>
              <Text style={styles.depletedText}>Epuisee</Text>
            </View>
          ) : !werewolfTarget ? (
            <Text style={styles.potionHint}>Personne a sauver</Text>
          ) : heal ? (
            <Pressable
              style={styles.potionActionActive}
              onPress={() => setHeal(false)}
            >
              <Text style={styles.potionActionActiveText}>Sauver {werewolfTarget.name}</Text>
              <Text style={styles.undoHint}>Appuyer pour annuler</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.potionAction}
              onPress={() => setHeal(true)}
            >
              <Text style={styles.potionActionText}>Sauver {werewolfTarget.name}</Text>
            </Pressable>
          )}
        </View>

        {/* Death Potion Card */}
        <View style={[
          styles.potionCard,
          styles.potionCardDeath,
          !deathAvailable && styles.potionCardDepleted,
        ]}>
          <Image source={require("../../assets/poison-potion.png")} style={styles.potionImage} resizeMode="contain" />
          <Text style={styles.potionTitle}>Mort</Text>

          {!deathAvailable ? (
            <View style={styles.depletedBadge}>
              <Text style={styles.depletedText}>Epuisee</Text>
            </View>
          ) : killTargetId ? (
            <Pressable
              style={styles.potionActionDanger}
              onPress={() => {
                setKillTargetId(null);
                setShowPoisonTargets(false);
              }}
            >
              <Text style={styles.potionActionDangerText}>Tuer {selectedVictimName}</Text>
              <Text style={styles.undoHintDanger}>Appuyer pour annuler</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.potionAction}
              onPress={() => setShowPoisonTargets(true)}
            >
              <Text style={styles.potionActionText}>Choisir une cible</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Poison target selection */}
      {showPoisonTargets && !killTargetId && (
        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>Qui empoisonner ?</Text>
          <ScrollView style={styles.targetList}>
            {action.targets.map((item) => (
              <Pressable
                key={item.id}
                style={styles.targetRow}
                onPress={() => {
                  setKillTargetId(item.id);
                  setShowPoisonTargets(false);
                }}
              >
                <Text style={styles.targetName}>{item.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={styles.cancelTargetButton}
            onPress={() => setShowPoisonTargets(false)}
          >
            <Text style={styles.cancelTargetText}>Annuler</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom actions */}
      {!showPoisonTargets && (
        <View style={styles.bottomActions}>
          {hasAction ? (
            <Pressable style={styles.confirmButton} onPress={() => handleSubmit()}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.passButton} onPress={() => handleSubmit(false, null)}>
              <Text style={styles.passButtonText}>Ne rien faire</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 22,
    color: colors.white,
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  victimBanner: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(233,69,96,0.25)",
  },
  victimIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  victimLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  victimName: {
    fontFamily: fonts.cinzelBold,
    color: colors.danger,
    fontSize: 22,
    textShadowColor: "rgba(233,69,96,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  potionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  potionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 180,
    justifyContent: "center",
  },
  potionCardLife: {
    backgroundColor: "rgba(90,30,30,0.25)",
    borderColor: "rgba(233,69,96,0.35)",
  },
  potionCardDeath: {
    backgroundColor: "rgba(30,70,30,0.25)",
    borderColor: "rgba(78,204,163,0.35)",
  },
  potionCardDepleted: {
    opacity: 0.4,
    backgroundColor: "rgba(30,30,50,0.3)",
    borderColor: "rgba(100,100,100,0.2)",
  },
  potionImage: {
    width: 64,
    height: 80,
    marginBottom: 6,
  },
  potionTitle: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 16,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  potionHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
  depletedBadge: {
    backgroundColor: "rgba(100,100,100,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  depletedText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
  },
  potionAction: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    width: "100%",
    alignItems: "center",
  },
  potionActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  potionActionActive: {
    backgroundColor: "rgba(78,204,163,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.success,
    width: "100%",
    alignItems: "center",
  },
  potionActionActiveText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  potionActionDanger: {
    backgroundColor: "rgba(233,69,96,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.danger,
    width: "100%",
    alignItems: "center",
  },
  potionActionDangerText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  undoHint: {
    color: "rgba(78,204,163,0.6)",
    fontSize: 11,
    marginTop: 3,
  },
  undoHintDanger: {
    color: "rgba(233,69,96,0.6)",
    fontSize: 11,
    marginTop: 3,
  },
  targetSection: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(233,69,96,0.2)",
  },
  targetTitle: {
    fontFamily: fonts.cinzelBold,
    color: colors.danger,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(233,69,96,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  targetList: {
    flex: 1,
    marginBottom: 12,
  },
  targetRow: {
    backgroundColor: "rgba(90,30,60,0.3)",
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(233,69,96,0.15)",
  },
  targetName: {
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  cancelTargetButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelTargetText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomActions: {
    paddingTop: 8,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  passButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  passButtonText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
  },
});
