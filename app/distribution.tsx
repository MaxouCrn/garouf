import { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, ImageBackground, StyleSheet, Animated, Easing } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_CARDS, ROLE_LABELS } from "../theme/roleCards";

const CARD_WIDTH = 220;
const CARD_HEIGHT = 330;

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const flipAnim = useRef(new Animated.Value(0)).current;

  const currentPlayer = state.players[state.distributionIndex];
  if (!currentPlayer) return null;

  const role = currentPlayer.role;
  const roleInfo = role ? ROLE_LABELS[role] : null;
  const cardImage = role ? ROLE_CARDS[role] : null;

  useEffect(() => {
    flipAnim.setValue(0);
  }, [state.distributionIndex]);

  const handleFlip = () => {
    dispatch({ type: "REVEAL_ROLE" });
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    dispatch({ type: "NEXT_PLAYER" });
    if (state.distributionIndex + 1 >= state.players.length) {
      router.replace("/night");
    }
  };

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <>
      <Stack.Screen
        options={{ title: "Distribution", headerShown: false }}
      />
      <ImageBackground
        source={require("../assets/devoilement-background.png")}
        style={styles.container}
        resizeMode="cover"
      >
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
              <Pressable onPress={handleFlip}>
                <Image
                  source={require("../assets/cards/back-card.png")}
                  style={styles.card}
                  resizeMode="contain"
                />
              </Pressable>
              <Text style={styles.hint}>Appuyez sur la carte</Text>
            </>
          ) : (
            <>
              <Text style={styles.playerName}>{currentPlayer.name}</Text>
              <View style={styles.cardContainer}>
                <Animated.View style={[styles.cardFace, { transform: [{ perspective: 1000 }, { rotateY: frontRotateY }], opacity: frontOpacity }]}>
                  <Image
                    source={require("../assets/cards/back-card.png")}
                    style={styles.card}
                    resizeMode="contain"
                  />
                </Animated.View>
                <Animated.View style={[styles.cardFace, { transform: [{ perspective: 1000 }, { rotateY: backRotateY }], opacity: backOpacity }]}>
                  {cardImage ? (
                    <Image
                      source={cardImage}
                      style={styles.card}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.card, styles.fallbackCard]}>
                      <Text style={styles.roleEmoji}>{roleInfo?.emoji}</Text>
                      <Text style={styles.fallbackLabel}>{roleInfo?.label}</Text>
                    </View>
                  )}
                </Animated.View>
              </View>
              <Text style={styles.roleName}>
                {roleInfo?.label}
              </Text>
              <Pressable style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Suivant</Text>
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
  progress: {
    fontSize: 15,
    color: colors.white,
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
    color: colors.white,
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
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 20,
  },
  cardFace: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
  },
  fallbackCard: {
    backgroundColor: "rgba(22,33,62,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  fallbackLabel: {
    fontFamily: fonts.cinzelBold,
    color: colors.white,
    fontSize: 20,
  },
  hint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleName: {
    fontFamily: fonts.cinzelRegular,
    color: colors.white,
    fontSize: 24,
    marginBottom: 24,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.cinzelBold,
  },
});
