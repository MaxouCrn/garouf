import { View, Text, Image, Pressable, ImageBackground, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_CARDS, ROLE_LABELS } from "../theme/roleCards";

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const currentPlayer = state.players[state.distributionIndex];
  if (!currentPlayer) return null;

  const role = currentPlayer.role;
  const roleInfo = role ? ROLE_LABELS[role] : null;
  const cardImage = role ? ROLE_CARDS[role] : null;

  const handleNext = () => {
    dispatch({ type: "NEXT_PLAYER" });
    if (state.distributionIndex + 1 >= state.players.length) {
      router.replace("/night");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "Distribution", headerShown: false }}
      />
      <ImageBackground
        source={require("../assets/config-background.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <Text style={styles.title}>Distribution</Text>
        <Text style={styles.progress}>
          {state.distributionIndex + 1} / {state.players.length}
        </Text>

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
              {cardImage ? (
                <Image
                  source={cardImage}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.roleEmoji}>{roleInfo?.emoji}</Text>
              )}
              <Text style={styles.roleName}>
                {roleInfo?.label}
              </Text>
              <Pressable style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>J'ai compris, suivant</Text>
              </Pressable>
            </>
          )}
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
  progress: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playerName: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 32,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardImage: {
    width: 200,
    height: 300,
    borderRadius: 16,
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
    marginBottom: 32,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
