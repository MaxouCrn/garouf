import { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, FlatList, ImageBackground, StyleSheet, Animated, Easing, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { useGame, Role } from "../context/GameContext";
import { useNarrator } from "../hooks/useNarrator";
import SafeContainer from "../components/SafeContainer";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_CARDS, ROLE_LABELS } from "../theme/roleCards";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ROLE_LABEL_STRINGS: Record<Role, string> = {
  werewolf: "Loup-Garou",
  villager: "Villageois",
  seer: "Voyante",
  witch: "Sorciere",
  hunter: "Chasseur",
  cupid: "Cupidon",
  little_girl: "Petite Fille",
  savior: "Salvateur",
  elder: "Ancien",
  raven: "Corbeau",
  village_idiot: "Idiot du Village",
};

export default function NightScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const nightOpacity = useRef(new Animated.Value(0)).current;
  const sunriseOpacity = useRef(new Animated.Value(0)).current;

  useNarrator(state.nightStep); // Local mode: manual buttons, no auto-advance needed

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const aliveNonWolves = alivePlayers.filter((p) => p.role !== "werewolf");

  const handleNextStep = () => {
    dispatch({ type: "NEXT_NIGHT_STEP" });
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_NIGHT" });
  };

  useEffect(() => {
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "day") router.replace("/day");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  useEffect(() => {
    if (state.nightStep === "intro") {
      nightOpacity.setValue(0);
      sunriseOpacity.setValue(0);
      Animated.timing(nightOpacity, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (state.nightStep === "resolution") {
      sunriseOpacity.setValue(0);
      Animated.timing(sunriseOpacity, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [state.nightStep]);

  const nightTitle = `Nuit ${state.turn}`;

  return (
    <>
      <Stack.Screen
        options={{ title: nightTitle, headerShown: false }}
      />
      <View style={styles.backgroundContainer}>
        <ImageBackground
          source={require("../assets/sunset-background.png")}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: state.nightStep === "intro" ? nightOpacity : 1 }]}>
          <ImageBackground
            source={require("../assets/night-transition-background.png")}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: sunriseOpacity }]}>
          <ImageBackground
            source={require("../assets/sun-transition-background.png")}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </Animated.View>
        <SafeContainer>
        {state.nightStep === "intro" && (
          <View style={styles.centered}>
            <Text style={styles.title}>La nuit tombe...</Text>
            <Text style={styles.subtitle}>Tout le monde ferme les yeux</Text>
            <Pressable style={styles.button} onPress={handleNextStep}>
              <Text style={styles.buttonText}>Continuer</Text>
            </Pressable>
          </View>
        )}

        {state.nightStep === "werewolves" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>🐺 Les Loups-Garous se reveillent</Text>
            <Text style={styles.instruction}>
              Choisissez une victime :
            </Text>
            <FlatList
              data={aliveNonWolves}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.playerOption,
                    state.nightActions.werewolvesTarget === item.id &&
                      styles.playerOptionSelected,
                  ]}
                  onPress={() =>
                    dispatch({
                      type: "SET_WEREWOLF_TARGET",
                      playerId: item.id,
                    })
                  }
                >
                  <Text style={styles.playerOptionText}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable
              style={[
                styles.button,
                !state.nightActions.werewolvesTarget && styles.buttonDisabled,
              ]}
              onPress={handleNextStep}
              disabled={!state.nightActions.werewolvesTarget}
            >
              <Text style={styles.buttonText}>Confirmer</Text>
            </Pressable>
          </View>
        )}

        {state.nightStep === "seer" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>🔮 La Voyante se reveille</Text>
            <Text style={styles.instruction}>
              Choisissez un joueur a inspecter :
            </Text>
            {state.nightActions.seerTarget ? (
              (() => {
                const targetPlayer = state.players.find((p) => p.id === state.nightActions.seerTarget);
                const targetRole = targetPlayer?.role ?? "villager";
                const targetCard = ROLE_CARDS[targetRole];
                return (
                  <View style={styles.centered}>
                    <Text style={styles.revealName}>
                      {targetPlayer?.name}
                    </Text>
                    {targetCard ? (
                      <Image source={targetCard} style={styles.seerCard} resizeMode="contain" />
                    ) : (
                      <Text style={styles.revealRole}>
                        {ROLE_LABEL_STRINGS[targetRole]}
                      </Text>
                    )}
                    <Pressable style={styles.button} onPress={handleNextStep}>
                      <Text style={styles.buttonText}>Continuer</Text>
                    </Pressable>
                  </View>
                );
              })()
            ) : (
              <FlatList
                data={alivePlayers.filter(
                  (p) => p.role !== "seer"
                )}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.playerOption}
                    onPress={() =>
                      dispatch({
                        type: "SET_SEER_TARGET",
                        playerId: item.id,
                      })
                    }
                  >
                    <Text style={styles.playerOptionText}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        )}

        {state.nightStep === "cupid" && (
          <CupidStep
            alivePlayers={alivePlayers}
            dispatch={dispatch}
            onNext={handleNextStep}
          />
        )}

        {state.nightStep === "lovers_reveal" && (
          <LoversRevealStep
            state={state}
            onNext={handleNextStep}
          />
        )}

        {state.nightStep === "savior" && (
          <SaviorStep
            alivePlayers={alivePlayers}
            lastSaviorTarget={state.lastSaviorTarget}
            dispatch={dispatch}
            onNext={handleNextStep}
          />
        )}

        {state.nightStep === "witch" && (
          <WitchStep
            state={state}
            dispatch={dispatch}
            onNext={handleNextStep}
            aliveNonWolves={aliveNonWolves}
            alivePlayers={alivePlayers}
          />
        )}

        {state.nightStep === "raven" && (
          <RavenStep
            alivePlayers={alivePlayers}
            dispatch={dispatch}
            onNext={handleNextStep}
          />
        )}

        {state.nightStep === "little_girl" && (
          <LittleGirlStep
            state={state}
            onNext={handleNextStep}
          />
        )}

        {state.nightStep === "resolution" && (
          <View style={styles.centered}>
            <Text style={styles.title}>Le soleil se leve...</Text>
            <Pressable style={styles.button} onPress={handleResolve}>
              <Text style={styles.buttonText}>Reveler les evenements</Text>
            </Pressable>
          </View>
        )}
        </SafeContainer>
      </View>
    </>
  );
}

function useWitchPotionPulse(enabled: boolean) {
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

function useWitchTargetSlide(visible: boolean) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);
  return anim;
}

function WitchStep({
  state,
  dispatch,
  onNext,
  alivePlayers,
}: {
  state: ReturnType<typeof useGame>["state"];
  dispatch: ReturnType<typeof useGame>["dispatch"];
  onNext: () => void;
  aliveNonWolves: ReturnType<typeof useGame>["state"]["players"];
  alivePlayers: ReturnType<typeof useGame>["state"]["players"];
}) {
  const [showPoisonTargets, setShowPoisonTargets] = useState(false);

  const victim = state.players.find(
    (p) => p.id === state.nightActions.werewolvesTarget
  );
  const hasLifePotion = state.witchPotions.life;
  const hasDeathPotion = state.witchPotions.death;
  const healUsed = state.nightActions.witchHeal;
  const killTarget = state.nightActions.witchKill;

  const poisonTargets = alivePlayers.filter(
    (p) => p.role !== "witch" && p.id !== state.nightActions.werewolvesTarget
  );

  const selectedVictimName = killTarget
    ? alivePlayers.find((p) => p.id === killTarget)?.name
    : null;

  const hasAction = healUsed || killTarget;

  const lifePulse = useWitchPotionPulse(hasLifePotion && !!victim && !healUsed);
  const deathPulse = useWitchPotionPulse(hasDeathPotion && !killTarget);
  const targetSlide = useWitchTargetSlide(showPoisonTargets && !killTarget);

  const handleHeal = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: "SET_WITCH_HEAL", heal: value });
  };

  const handleSelectTarget = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    dispatch({ type: "SET_WITCH_KILL", playerId });
    setShowPoisonTargets(false);
  };

  const handleClearTarget = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "SET_WITCH_KILL", playerId: null });
    setShowPoisonTargets(false);
  };

  const handleShowTargets = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowPoisonTargets(true);
  };

  const handleHideTargets = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowPoisonTargets(false);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
  };

  // Build recap lines
  const recapParts: string[] = [];
  if (healUsed && victim) recapParts.push(`Sauver ${victim.name}`);
  if (killTarget && selectedVictimName) recapParts.push(`Empoisonner ${selectedVictimName}`);

  return (
    <View style={witchStyles.container}>
      <Text style={styles.stepTitle}>La Sorciere se reveille</Text>

      {/* Victim announcement */}
      <View style={witchStyles.victimBanner}>
        <Text style={witchStyles.victimIcon}>💀</Text>
        {victim ? (
          <>
            <Text style={witchStyles.victimLabel}>Victime des loups</Text>
            <Text style={witchStyles.victimName}>{victim.name}</Text>
          </>
        ) : (
          <Text style={witchStyles.victimLabel}>Aucune victime cette nuit</Text>
        )}
      </View>

      {/* Potion cards */}
      <View style={witchStyles.potionsRow}>
        {/* Life Potion Card */}
        <Animated.View style={[
          witchStyles.potionCard,
          witchStyles.potionCardLife,
          !hasLifePotion && witchStyles.potionCardDepleted,
          hasLifePotion && { transform: [{ scale: lifePulse }] },
        ]}>
          <Image source={require("../assets/health-potion.png")} style={witchStyles.potionImage} resizeMode="contain" />
          <Text style={witchStyles.potionTitle}>Vie</Text>

          {!hasLifePotion ? (
            <View style={witchStyles.depletedBadge}>
              <Text style={witchStyles.depletedText}>🔒 Epuisee</Text>
            </View>
          ) : !victim ? (
            <Text style={witchStyles.potionHint}>Personne a sauver</Text>
          ) : healUsed ? (
            <Pressable
              style={witchStyles.potionActionActive}
              onPress={() => handleHeal(false)}
            >
              <Text style={witchStyles.potionActionActiveText}>Sauver {victim.name}</Text>
              <Text style={witchStyles.undoHint}>Appuyer pour annuler</Text>
            </Pressable>
          ) : (
            <Pressable
              style={witchStyles.potionAction}
              onPress={() => handleHeal(true)}
            >
              <Text style={witchStyles.potionActionText}>Sauver {victim.name}</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Death Potion Card */}
        <Animated.View style={[
          witchStyles.potionCard,
          witchStyles.potionCardDeath,
          !hasDeathPotion && witchStyles.potionCardDepleted,
          hasDeathPotion && { transform: [{ scale: deathPulse }] },
        ]}>
          <Image source={require("../assets/poison-potion.png")} style={witchStyles.potionImage} resizeMode="contain" />
          <Text style={witchStyles.potionTitle}>Mort</Text>

          {!hasDeathPotion ? (
            <View style={witchStyles.depletedBadge}>
              <Text style={witchStyles.depletedText}>🔒 Epuisee</Text>
            </View>
          ) : killTarget ? (
            <Pressable
              style={witchStyles.potionActionDanger}
              onPress={handleClearTarget}
            >
              <Text style={witchStyles.potionActionDangerText}>Tuer {selectedVictimName}</Text>
              <Text style={witchStyles.undoHintDanger}>Appuyer pour annuler</Text>
            </Pressable>
          ) : (
            <Pressable
              style={witchStyles.potionAction}
              onPress={handleShowTargets}
            >
              <Text style={witchStyles.potionActionText}>Empoisonner</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Poison target selection (animated) */}
      {showPoisonTargets && !killTarget && (
        <Animated.View style={[
          witchStyles.targetSection,
          {
            opacity: targetSlide,
            transform: [{ translateY: targetSlide.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          },
        ]}>
          <Text style={witchStyles.targetTitle}>Qui empoisonner ?</Text>
          <ScrollView style={witchStyles.targetList}>
            {poisonTargets.map((item) => (
              <Pressable
                key={item.id}
                style={witchStyles.targetRow}
                onPress={() => handleSelectTarget(item.id)}
              >
                <Text style={witchStyles.targetName}>{item.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={witchStyles.cancelTargetButton}
            onPress={handleHideTargets}
          >
            <Text style={witchStyles.cancelTargetText}>Annuler</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Bottom actions */}
      {!showPoisonTargets && (
        <View style={witchStyles.bottomActions}>
          {/* Recap */}
          {recapParts.length > 0 && (
            <View style={witchStyles.recapContainer}>
              {recapParts.map((part, i) => (
                <Text key={i} style={witchStyles.recapText}>{part}</Text>
              ))}
            </View>
          )}
          {hasAction ? (
            <Pressable style={witchStyles.confirmButton} onPress={handleConfirm}>
              <Text style={witchStyles.confirmButtonText}>Confirmer</Text>
            </Pressable>
          ) : (
            <Pressable style={witchStyles.passButton} onPress={onNext}>
              <Text style={witchStyles.passButtonText}>Ne rien faire</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const witchStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  victimBanner: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
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
    justifyContent: "center",
    minHeight: 42,
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
    justifyContent: "center",
    minHeight: 42,
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
    justifyContent: "center",
    minHeight: 42,
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
  recapContainer: {
    backgroundColor: "rgba(212,160,23,0.1)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.25)",
    alignItems: "center",
  },
  recapText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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

function CupidStep({
  alivePlayers,
  dispatch,
  onNext,
}: {
  alivePlayers: ReturnType<typeof useGame>["state"]["players"];
  dispatch: ReturnType<typeof useGame>["dispatch"];
  onNext: () => void;
}) {
  const [cupidSelections, setCupidSelections] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setCupidSelections((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (cupidSelections.length === 2) {
      dispatch({
        type: "SET_LOVERS",
        player1Id: cupidSelections[0],
        player2Id: cupidSelections[1],
      });
      onNext();
    }
  };

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.stepTitle}>💘 Cupidon se réveille</Text>
      <Text style={styles.instruction}>
        Désigne 2 joueurs qui seront liés par l'amour.
      </Text>
      <FlatList
        data={alivePlayers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.playerOption,
              cupidSelections.includes(item.id) && styles.playerOptionSelected,
            ]}
            onPress={() => toggleSelection(item.id)}
          >
            <Text style={styles.playerOptionText}>{item.name}</Text>
          </Pressable>
        )}
      />
      <Pressable
        style={[
          styles.button,
          cupidSelections.length !== 2 && styles.buttonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={cupidSelections.length !== 2}
      >
        <Text style={styles.buttonText}>Confirmer</Text>
      </Pressable>
    </View>
  );
}

function LoversRevealStep({
  state,
  onNext,
}: {
  state: ReturnType<typeof useGame>["state"];
  onNext: () => void;
}) {
  const lover1 = state.players.find((p) => p.id === state.lovers?.[0]);
  const lover2 = state.players.find((p) => p.id === state.lovers?.[1]);

  const isMixed =
    lover1 && lover2 &&
    ((lover1.role === "werewolf") !== (lover2.role === "werewolf"));

  return (
    <View style={styles.centered}>
      <Text style={styles.stepTitle}>💘 Les Amoureux se découvrent</Text>
      <Text style={styles.revealName}>{lover1?.name}</Text>
      <Text style={styles.instruction}>&</Text>
      <Text style={styles.revealName}>{lover2?.name}</Text>
      {isMixed ? (
        <Text style={styles.warningText}>
          Votre amour est interdit... Vous devez être les derniers survivants
          pour gagner.
        </Text>
      ) : (
        <Text style={styles.instruction}>
          Votre amour est pur. Protégez-vous mutuellement.
        </Text>
      )}
      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Compris</Text>
      </Pressable>
    </View>
  );
}

function SaviorStep({
  alivePlayers,
  lastSaviorTarget,
  dispatch,
  onNext,
}: {
  alivePlayers: ReturnType<typeof useGame>["state"]["players"];
  lastSaviorTarget: string | null;
  dispatch: ReturnType<typeof useGame>["dispatch"];
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selected) {
      dispatch({ type: "SET_SAVIOR_TARGET", playerId: selected });
      onNext();
    }
  };

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.stepTitle}>🛡️ Le Salvateur se réveille</Text>
      <Text style={styles.instruction}>
        Désigne un joueur à protéger cette nuit.
      </Text>
      <FlatList
        data={alivePlayers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const isDisabled = item.id === lastSaviorTarget;
          return (
            <Pressable
              style={[
                styles.playerOption,
                selected === item.id && styles.playerOptionSelected,
                isDisabled && styles.playerOptionDisabled,
              ]}
              onPress={() => !isDisabled && setSelected(item.id)}
              disabled={isDisabled}
            >
              <Text
                style={[
                  styles.playerOptionText,
                  isDisabled && styles.playerOptionTextDisabled,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
      <Pressable
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Confirmer</Text>
      </Pressable>
    </View>
  );
}

function RavenStep({
  alivePlayers,
  dispatch,
  onNext,
}: {
  alivePlayers: ReturnType<typeof useGame>["state"]["players"];
  dispatch: ReturnType<typeof useGame>["dispatch"];
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    dispatch({ type: "SET_RAVEN_TARGET", playerId: selected });
    onNext();
  };

  const handleSkip = () => {
    dispatch({ type: "SET_RAVEN_TARGET", playerId: null });
    onNext();
  };

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.stepTitle}>🐦‍⬛ Le Corbeau se réveille</Text>
      <Text style={styles.instruction}>
        Désigne un joueur qui portera ta marque.
      </Text>
      <FlatList
        data={alivePlayers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.playerOption,
              selected === item.id && styles.playerOptionSelected,
            ]}
            onPress={() => setSelected(item.id)}
          >
            <Text style={styles.playerOptionText}>{item.name}</Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.buttonSecondary} onPress={handleSkip}>
        <Text style={styles.buttonSecondaryText}>Passer</Text>
      </Pressable>
      <Pressable
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Confirmer</Text>
      </Pressable>
    </View>
  );
}

function LittleGirlStep({
  state,
  onNext,
}: {
  state: ReturnType<typeof useGame>["state"];
  onNext: () => void;
}) {
  const clueNames = (state.littleGirlClue ?? []).map((id) => {
    const player = state.players.find((p) => p.id === id);
    return player?.name ?? "???";
  });

  return (
    <View style={styles.centered}>
      <Text style={styles.stepTitle}>👧 La Petite Fille entrouvre les yeux...</Text>
      <Text style={styles.instruction}>
        Tu aperçois des silhouettes dans la nuit...
      </Text>
      {clueNames.map((name, idx) => (
        <View key={idx} style={styles.clueCard}>
          <Text style={styles.clueCardText}>{name}</Text>
        </View>
      ))}
      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Refermer les yeux</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
  },
  fullContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: colors.white,
    fontSize: 18,
    marginBottom: 48,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  stepTitle: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  instruction: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  playerOption: {
    backgroundColor: "rgba(22,33,62,0.8)",
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionSelected: {
    backgroundColor: colors.primary,
  },
  playerOptionDanger: {
    backgroundColor: colors.danger,
  },
  playerOptionText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  seerCard: {
    width: 160,
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
  },
  revealName: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 28,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  revealRole: {
    fontFamily: fonts.cinzelRegular,
    color: colors.ember,
    fontSize: 24,
    marginBottom: 32,
  },
  warningText: {
    color: "#fbbf24",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
    paddingHorizontal: 20,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playerOptionDisabled: {
    backgroundColor: "rgba(22,33,62,0.4)",
    opacity: 0.5,
  },
  playerOptionTextDisabled: {
    color: "rgba(255,255,255,0.4)",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonSecondaryText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  clueCard: {
    backgroundColor: "rgba(22,33,62,0.8)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 8,
  },
  clueCardText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
