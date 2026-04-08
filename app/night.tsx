import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { useNarrator } from "../hooks/useNarrator";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

const ROLE_LABELS: Record<Role, string> = {
  werewolf: "Loup-Garou",
  villager: "Villageois",
  seer: "Voyante",
  witch: "Sorciere",
  hunter: "Chasseur",
};

export default function NightScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

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

  const nightTitle = `Nuit ${state.turn}`;

  return (
    <>
      <Stack.Screen
        options={{ title: nightTitle, headerBackVisible: false }}
      />
      <CardFrame title={nightTitle}>
        {state.nightStep === "intro" && (
          <View style={styles.centered}>
            <Text style={styles.emoji}>🌙</Text>
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
              <View style={styles.centered}>
                <Text style={styles.revealName}>
                  {state.players.find((p) => p.id === state.nightActions.seerTarget)?.name}
                </Text>
                <Text style={styles.revealRole}>
                  {ROLE_LABELS[
                    state.players.find(
                      (p) => p.id === state.nightActions.seerTarget
                    )?.role ?? "villager"
                  ]}
                </Text>
                <Pressable style={styles.button} onPress={handleNextStep}>
                  <Text style={styles.buttonText}>Continuer</Text>
                </Pressable>
              </View>
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

        {state.nightStep === "witch" && (
          <WitchStep
            state={state}
            dispatch={dispatch}
            onNext={handleNextStep}
            aliveNonWolves={aliveNonWolves}
            alivePlayers={alivePlayers}
          />
        )}

        {state.nightStep === "resolution" && (
          <View style={styles.centered}>
            <Text style={styles.emoji}>☀️</Text>
            <Text style={styles.title}>Le soleil se leve...</Text>
            <Pressable style={styles.button} onPress={handleResolve}>
              <Text style={styles.buttonText}>Reveler les evenements</Text>
            </Pressable>
          </View>
        )}
      </CardFrame>
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

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 48,
  },
  stepTitle: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  playerOption: {
    backgroundColor: colors.surface,
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
  revealName: {
    fontFamily: fonts.cinzelBold,
    color: colors.text,
    fontSize: 28,
    marginBottom: 8,
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
});
