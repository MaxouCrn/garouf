import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const currentPlayer = state.players[state.distributionIndex];
  if (!currentPlayer) return null;

  const roleInfo = currentPlayer.role
    ? ROLE_LABELS[currentPlayer.role]
    : null;

  const handleNext = () => {
    dispatch({ type: "NEXT_PLAYER" });
    // If last player, NEXT_PLAYER sets phase to "night" — navigate
    if (state.distributionIndex + 1 >= state.players.length) {
      router.replace("/night");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Distribution", headerBackVisible: false }}
      />

      {!state.revealedRole ? (
        <>
          <Text style={styles.instruction}>
            Passez le telephone a :
          </Text>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.hint}>
            {state.distributionIndex + 1} / {state.players.length}
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => dispatch({ type: "REVEAL_ROLE" })}
          >
            <Text style={styles.buttonText}>Voir mon role</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.roleEmoji}>{roleInfo?.emoji}</Text>
          <Text style={styles.roleName}>
            {roleInfo?.label}
          </Text>
          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>J'ai compris, suivant</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 8,
  },
  playerName: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 16,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 32,
  },
  roleEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  roleName: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
