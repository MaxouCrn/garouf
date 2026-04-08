import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

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
    if (state.distributionIndex + 1 >= state.players.length) {
      router.replace("/night");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "Distribution", headerBackVisible: false }}
      />
      <CardFrame
        title="Distribution"
        subtitle={`${state.distributionIndex + 1} / ${state.players.length}`}
      >
        <View style={styles.centered}>
          {!state.revealedRole ? (
            <>
              <Text style={styles.instruction}>
                Passez le telephone a :
              </Text>
              <Text style={styles.playerName}>{currentPlayer.name}</Text>
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
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 8,
  },
  playerName: {
    fontFamily: fonts.cinzelBold,
    color: colors.text,
    fontSize: 32,
    marginBottom: 16,
  },
  roleEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  roleName: {
    fontFamily: fonts.cinzelRegular,
    color: colors.primary,
    fontSize: 28,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
