import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { useSoundEffect, useLoopingSound } from "../hooks/useSoundEffect";
import { colors } from "../theme/colors";

// Sound assets — set to null when file not yet available
const SOUNDS = {
  werewolf: require("../assets/sounds/werewolf.mp3"),
  seer: null,     // futur: require("../assets/sounds/seer.mp3")
  witch: null,    // futur: require("../assets/sounds/witch.mp3")
  ambiance: null, // futur: require("../assets/sounds/night_ambiance.mp3")
};

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

  const werewolfSound = useSoundEffect(SOUNDS.werewolf);
  const seerSound = useSoundEffect(SOUNDS.seer);
  const witchSound = useSoundEffect(SOUNDS.witch);
  const ambianceSound = useLoopingSound(SOUNDS.ambiance);

  // Play ambiance loop on mount
  useEffect(() => {
    ambianceSound.start();
    return () => { ambianceSound.stop(); };
  }, []);

  // Play sound effect per night step
  useEffect(() => {
    if (state.nightStep === "werewolves") werewolfSound.play();
    else if (state.nightStep === "seer") seerSound.play();
    else if (state.nightStep === "witch") witchSound.play();
  }, [state.nightStep]);

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const aliveNonWolves = alivePlayers.filter((p) => p.role !== "werewolf");

  const handleNextStep = () => {
    dispatch({ type: "NEXT_NIGHT_STEP" });
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_NIGHT" });
  };

  // After RESOLVE_NIGHT, phase changes — navigate via useEffect
  useEffect(() => {
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "day") router.replace("/day");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: `Nuit ${state.turn}`, headerBackVisible: false }}
      />

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
    </View>
  );
}

// Witch sub-component (kept in same file — tightly coupled to night flow)
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullContainer: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 48,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
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
    margin: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  revealName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  revealRole: {
    color: colors.warning,
    fontSize: 24,
    fontWeight: "bold",
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
