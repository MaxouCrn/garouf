import { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, FlatList, ImageBackground, StyleSheet, Animated, Easing } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { useNarrator } from "../hooks/useNarrator";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_CARDS, ROLE_LABELS } from "../theme/roleCards";

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

  useNarrator(state.nightStep);

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
        <View style={styles.overlay}>
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
        </View>
      </View>
    </>
  );
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
  const victim = state.players.find(
    (p) => p.id === state.nightActions.werewolvesTarget
  );
  const canHeal = state.witchPotions.life && !state.nightActions.witchHeal;
  const canKill = state.witchPotions.death && !state.nightActions.witchKill;

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.stepTitle}>🧪 La Sorciere se reveille</Text>

      {victim && (
        <Text style={styles.instruction}>
          Cette nuit, {victim.name} a ete attaque(e).
        </Text>
      )}

      {canHeal && victim && (
        <Pressable
          style={[styles.potionButton, styles.potionLife]}
          onPress={() => dispatch({ type: "SET_WITCH_HEAL", heal: true })}
        >
          <Text style={styles.buttonText}>💚 Utiliser la potion de vie</Text>
        </Pressable>
      )}

      {state.nightActions.witchHeal && (
        <Text style={styles.potionUsed}>
          ✅ Potion de vie utilisee
        </Text>
      )}

      {canKill && (
        <>
          <Text style={styles.instruction}>Empoisonner quelqu'un ?</Text>
          <FlatList
            data={alivePlayers.filter(
              (p) =>
                p.role !== "witch" &&
                p.id !== state.nightActions.werewolvesTarget
            )}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.playerOption,
                  state.nightActions.witchKill === item.id &&
                    styles.playerOptionDanger,
                ]}
                onPress={() =>
                  dispatch({
                    type: "SET_WITCH_KILL",
                    playerId:
                      state.nightActions.witchKill === item.id
                        ? null
                        : item.id,
                  })
                }
              >
                <Text style={styles.playerOptionText}>{item.name}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
    </View>
  );
}

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
  overlay: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  potionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  potionLife: {
    backgroundColor: "#2d6a4f",
  },
  potionUsed: {
    color: colors.success,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
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
