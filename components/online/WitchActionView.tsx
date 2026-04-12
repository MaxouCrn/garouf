import { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Modal, StyleSheet, Animated, Easing } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import GCardFrame from "../GCardFrame";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

function usePotionPulse(enabled: boolean) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!enabled) {
      anim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.06, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enabled]);
  return anim;
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

  const lifePulse = usePotionPulse(lifeAvailable && !!werewolfTarget && !heal);
  const deathPulse = usePotionPulse(deathAvailable && !killTargetId);

  const handleSubmit = (healOverride?: boolean, killOverride?: string | null) => {
    onSubmit("witch_action", {
      heal: healOverride !== undefined ? healOverride : heal,
      killTargetId: killOverride !== undefined ? killOverride : killTargetId,
    });
  };

  const handleTimeout = () => {
    onSubmit("witch_action", { heal: false, killTargetId: null });
  };

  const handleHeal = (value: boolean) => {
    setHeal(value);
  };

  const handleSelectTarget = (id: string) => {
    setKillTargetId(id);
    setShowPoisonTargets(false);
  };

  const handleClearTarget = () => {
    setKillTargetId(null);
    setShowPoisonTargets(false);
  };

  const handleShowTargets = () => {
    setShowPoisonTargets(true);
  };

  const handleHideTargets = () => {
    setShowPoisonTargets(false);
  };

  // Build recap lines
  const recapParts: string[] = [];
  if (heal && werewolfTarget) recapParts.push(`Sauver ${werewolfTarget.name}`);
  if (killTargetId && selectedVictimName) recapParts.push(`Empoisonner ${selectedVictimName}`);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>La Sorciere</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />

      {/* Victim announcement */}
      <GCardFrame variant="glass" corners style={styles.victimBanner}>
        <Text style={styles.victimIcon}>💀</Text>
        {werewolfTarget ? (
          <>
            <Text style={styles.victimLabel}>Victime des loups</Text>
            <Text style={styles.victimName}>{werewolfTarget.name}</Text>
          </>
        ) : (
          <Text style={styles.victimLabel}>Aucune victime cette nuit</Text>
        )}
      </GCardFrame>

      {/* Potion cards */}
      <View style={styles.potionsRow}>
        {/* Life Potion Card */}
        <Animated.View style={[
          styles.potionAnimWrapper,
          lifeAvailable && { transform: [{ scale: lifePulse }] },
        ]}>
          <GCardFrame
            variant="glass"
            corners
            cornerColor={colors.danger}
            style={[
              styles.potionCardLife,
              !lifeAvailable && styles.potionCardDepleted,
            ]}
          >
            <View style={styles.potionContent}>
              <Image source={require("../../assets/health-potion.png")} style={styles.potionImage} resizeMode="contain" />
              <Text style={styles.potionTitle}>Vie</Text>

              {!lifeAvailable ? (
                <View style={styles.depletedBadge}>
                  <Text style={styles.depletedText}>🔒 Epuisee</Text>
                </View>
              ) : !werewolfTarget ? (
                <Text style={styles.potionHint}>Personne a sauver</Text>
              ) : heal ? (
                <Pressable
                  style={styles.potionActionLife}
                  onPress={() => handleHeal(false)}
                >
                  <Text style={styles.potionActionLifeText}>Sauver la cible</Text>
                  <Text style={styles.undoHintLife}>Appuyer pour annuler</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.potionAction}
                  onPress={() => handleHeal(true)}
                >
                  <Text style={styles.potionActionText}>Sauver la cible</Text>
                </Pressable>
              )}
            </View>
          </GCardFrame>
        </Animated.View>

        {/* Death Potion Card */}
        <Animated.View style={[
          styles.potionAnimWrapper,
          deathAvailable && { transform: [{ scale: deathPulse }] },
        ]}>
          <GCardFrame
            variant="glass"
            corners
            cornerColor={colors.success}
            style={[
              styles.potionCardDeath,
              !deathAvailable && styles.potionCardDepleted,
            ]}
          >
            <View style={styles.potionContent}>
              <Image source={require("../../assets/poison-potion.png")} style={styles.potionImage} resizeMode="contain" />
              <Text style={styles.potionTitle}>Mort</Text>

              {!deathAvailable ? (
                <View style={styles.depletedBadge}>
                  <Text style={styles.depletedText}>🔒 Epuisee</Text>
                </View>
              ) : killTargetId ? (
                <Pressable
                  style={styles.potionActionPoison}
                  onPress={handleClearTarget}
                >
                  <Text style={styles.potionActionPoisonText}>Tuer {selectedVictimName}</Text>
                  <Text style={styles.undoHintPoison}>Appuyer pour annuler</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.potionAction}
                  onPress={handleShowTargets}
                >
                  <Text style={styles.potionActionText}>Empoisonner</Text>
                </Pressable>
              )}
            </View>
          </GCardFrame>
        </Animated.View>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        {/* Recap */}
        {recapParts.length > 0 && (
          <View style={styles.recapContainer}>
            <Text style={styles.recapLabel}>Vos actions cette nuit</Text>
            {recapParts.map((part, i) => (
              <Text key={i} style={styles.recapText}>{part}</Text>
            ))}
          </View>
        )}
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

      {/* Poison target modal */}
      <Modal
        visible={showPoisonTargets && !killTargetId}
        transparent
        animationType="slide"
        onRequestClose={handleHideTargets}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.targetTitle}>Qui empoisonner ?</Text>
            <ScrollView style={styles.targetList} showsVerticalScrollIndicator={false}>
              {action.targets.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.targetRow}
                  onPress={() => handleSelectTarget(item.id)}
                >
                  <Text style={styles.targetName}>{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.cancelTargetButton}
              onPress={handleHideTargets}
            >
              <Text style={styles.cancelTargetText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    fontFamily: fonts.displayBold,
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
    marginVertical: 16,
  },
  victimIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  victimLabel: {
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  victimName: {
    fontFamily: fonts.displayBold,
    color: colors.danger,
    fontSize: 22,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  potionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  potionAnimWrapper: {
    flex: 1,
  },
  potionContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  potionCardLife: {
    backgroundColor: "rgba(90,30,30,0.45)",
    borderColor: "rgba(233,69,96,0.4)",
  },
  potionCardDeath: {
    backgroundColor: "rgba(30,70,30,0.45)",
    borderColor: "rgba(78,204,163,0.4)",
  },
  potionCardDepleted: {
    opacity: 0.4,
    backgroundColor: "rgba(30,30,50,0.5)",
    borderColor: "rgba(100,100,100,0.2)",
  },
  potionImage: {
    width: 64,
    height: 80,
    marginBottom: 6,
  },
  potionTitle: {
    fontFamily: fonts.displayBold,
    color: colors.white,
    fontSize: 16,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  potionHint: {
    fontFamily: fonts.bodyRegular,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  depletedBadge: {
    backgroundColor: "rgba(100,100,100,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  depletedText: {
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  potionAction: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  potionActionText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  potionActionLife: {
    backgroundColor: "rgba(233,69,96,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.danger,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  potionActionLifeText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  potionActionPoison: {
    backgroundColor: "rgba(78,204,163,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.success,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  potionActionPoisonText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.success,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  undoHintLife: {
    color: "rgba(233,69,96,0.7)",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
  undoHintPoison: {
    color: "rgba(78,204,163,0.7)",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "60%",
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.accent,
  },
  targetTitle: {
    fontFamily: fonts.displayBold,
    color: colors.danger,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(233,69,96,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  targetList: {
    marginBottom: 12,
  },
  targetRow: {
    backgroundColor: colors.glass,
    padding: 14,
    borderRadius: radii.base,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  targetName: {
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  cancelTargetButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    borderRadius: radii.base,
    alignItems: "center",
  },
  cancelTargetText: {
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomActions: {
    paddingTop: 8,
  },
  recapContainer: {
    backgroundColor: "rgba(126,184,218,0.06)",
    borderRadius: radii.base,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(126,184,218,0.2)",
    alignItems: "center",
  },
  recapLabel: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 4,
  },
  recapText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.base,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  passButton: {
    backgroundColor: colors.glass,
    padding: 16,
    borderRadius: radii.base,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  passButtonText: {
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
  },
});
