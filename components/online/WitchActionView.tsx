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

const PARTICLE_COUNT = 6;

function PotionParticles({ active, color }: { active: boolean; color: string }) {
  const anims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => {
        a.opacity.setValue(0);
        a.translateY.setValue(0);
        a.translateX.setValue(0);
      });
      return;
    }

    const animations = anims.map((a, i) => {
      const delay = i * 400;
      const xDrift = (Math.random() - 0.5) * 30;
      const rise = -80 - Math.random() * 40;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(a.opacity, { toValue: 0.9, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(a.opacity, { toValue: 0, duration: 1200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            ]),
            Animated.timing(a.translateY, { toValue: rise, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(a.translateX, { toValue: xDrift, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(a.translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(a.translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
    });

    const composite = Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  }, [active]);

  if (!active) return null;

  return (
    <View style={particleStyles.container} pointerEvents="none">
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[
            particleStyles.dot,
            { backgroundColor: color },
            {
              left: `${15 + (i * 70) / PARTICLE_COUNT}%` as unknown as number,
              bottom: 10,
              opacity: a.opacity,
              transform: [{ translateY: a.translateY }, { translateX: a.translateX }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const particleStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
  },
  dot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

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

      {/* Potion status cards */}
      <View style={styles.potionsRow}>
        {/* Life Potion Card */}
        <View style={styles.potionAnimWrapper}>
          <GCardFrame
            variant="glass"
            corners
            cornerColor={colors.danger}
            style={[
              styles.potionCard,
              styles.potionCardLife,
              !lifeAvailable && styles.potionCardDepleted,
              heal && styles.potionCardLifeActive,
            ]}
          >
            <PotionParticles active={heal} color={colors.danger} />
            <View style={styles.potionContent}>
              <Image
                source={lifeAvailable
                  ? require("../../assets/health-potion.png")
                  : require("../../assets/broken-healt-potion.png")
                }
                style={[styles.potionImage, !lifeAvailable && styles.potionImageDepleted]}
                resizeMode="contain"
              />
              <Text style={styles.potionTitle}>Potion de vie</Text>
              {!lifeAvailable && (
                <View style={styles.depletedBadge}>
                  <Text style={styles.depletedText}>Épuisée</Text>
                </View>
              )}
            </View>
          </GCardFrame>
        </View>

        {/* Death Potion Card */}
        <View style={styles.potionAnimWrapper}>
          <GCardFrame
            variant="glass"
            corners
            cornerColor={colors.success}
            style={[
              styles.potionCard,
              styles.potionCardDeath,
              !deathAvailable && styles.potionCardDepleted,
              !!killTargetId && styles.potionCardDeathActive,
            ]}
          >
            <PotionParticles active={!!killTargetId} color={colors.success} />
            <View style={styles.potionContent}>
              <Image
                source={deathAvailable
                  ? require("../../assets/poison-potion.png")
                  : require("../../assets/broken-poison-potion.png")
                }
                style={[styles.potionImage, !deathAvailable && styles.potionImageDepleted]}
                resizeMode="contain"
              />
              <Text style={styles.potionTitle}>Potion de mort</Text>
              {!deathAvailable && (
                <View style={styles.depletedBadge}>
                  <Text style={styles.depletedText}>Épuisée</Text>
                </View>
              )}
            </View>
          </GCardFrame>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {lifeAvailable && werewolfTarget && (
          <Pressable
            style={[styles.actionBtn, heal && styles.actionBtnLifeActive]}
            onPress={() => handleHeal(!heal)}
          >
            <Text style={[styles.actionBtnText, heal && styles.actionBtnLifeActiveText]}>Sauver la cible</Text>
            {heal && <Text style={styles.undoHintLife}>Appuyer pour annuler</Text>}
          </Pressable>
        )}
        {deathAvailable && (
          killTargetId ? (
            <Pressable
              style={[styles.actionBtn, styles.actionBtnDeathActive]}
              onPress={handleClearTarget}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnDeathActiveText]}>Tuer {selectedVictimName}</Text>
              <Text style={styles.undoHintPoison}>Appuyer pour annuler</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.actionBtn}
              onPress={handleShowTargets}
            >
              <Text style={styles.actionBtnText}>Empoisonner</Text>
            </Pressable>
          )
        )}
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
              {action.targets
                .filter((item) => !werewolfTarget || item.id !== werewolfTarget.id)
                .map((item) => (
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
    alignItems: "stretch",
    gap: 12,
    marginBottom: 16,
  },
  potionAnimWrapper: {
    flex: 1,
  },
  potionCard: {
  },
  potionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  potionCardLife: {
    backgroundColor: "rgba(90,30,30,0.45)",
    borderColor: "rgba(233,69,96,0.4)",
  },
  potionCardLifeActive: {
    borderColor: colors.danger,
  },
  potionCardDeath: {
    backgroundColor: "rgba(30,70,30,0.45)",
    borderColor: "rgba(78,204,163,0.4)",
  },
  potionCardDeathActive: {
    borderColor: colors.success,
  },
  potionCardDepleted: {
    opacity: 1,
    backgroundColor: "rgba(30,30,50,0.5)",
    borderColor: "rgba(100,100,100,0.2)",
  },
  potionImage: {
    width: 64,
    height: 80,
    marginBottom: 6,
  },
  potionImageDepleted: {
    opacity: 1,
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
  actionButtons: {
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.base,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionBtnLifeActive: {
    backgroundColor: "rgba(233,69,96,0.3)",
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  actionBtnLifeActiveText: {
    color: colors.white,
    fontWeight: "bold",
  },
  actionBtnDeathActive: {
    backgroundColor: "rgba(78,204,163,0.3)",
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  actionBtnDeathActiveText: {
    color: colors.white,
    fontWeight: "bold",
  },
  undoHintLife: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
  undoHintPoison: {
    color: "rgba(255,255,255,0.7)",
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
    backgroundColor: colors.glass,
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
