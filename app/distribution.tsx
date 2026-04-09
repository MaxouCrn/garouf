import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ImageBackground,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_CARDS, ROLE_LABELS } from "../theme/roleCards";
import { ROLE_REGISTRY } from "../game/roles";
import { useGyroscopeTilt } from "../hooks/useGyroscopeTilt";

const CARD_WIDTH = 220;
const CARD_HEIGHT = 330;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DETAIL_CARD_WIDTH = SCREEN_WIDTH * 0.6;
const DETAIL_CARD_HEIGHT = DETAIL_CARD_WIDTH * 1.45;

// --- Role Detail Modal (long press) ---

function RoleDetailModal({
  role,
  visible,
  onClose,
}: {
  role: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const descTranslateY = useRef(new Animated.Value(15)).current;

  const { tiltX, tiltY, TILT_INTENSITY } = useGyroscopeTilt(visible);

  const animateIn = useCallback(() => {
    overlayOpacity.setValue(0);
    cardScale.setValue(0.3);
    contentOpacity.setValue(0);
    descTranslateY.setValue(15);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 250,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(descTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.3,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  if (!role) return null;

  const roleDef = ROLE_REGISTRY[role as keyof typeof ROLE_REGISTRY];
  if (!roleDef) return null;

  const cardImage = ROLE_CARDS[role as keyof typeof ROLE_CARDS];
  const isWolf = roleDef.camp === "werewolves";
  const accentColor = isWolf ? colors.danger : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={animateIn}
      onRequestClose={animateOut}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={animateOut}>
        <Animated.View style={[detailStyles.overlay, { opacity: overlayOpacity }]} />
      </Pressable>

      <View style={detailStyles.content} pointerEvents="box-none">
        <Animated.View
          style={[
            detailStyles.container,
            { transform: [{ scale: cardScale }] },
          ]}
        >
          <Pressable style={detailStyles.closeButton} onPress={animateOut}>
            <Text style={detailStyles.closeButtonText}>✕</Text>
          </Pressable>

          {/* Card with gyroscope tilt */}
          <Animated.View
            style={[
              detailStyles.card,
              {
                borderColor: accentColor,
                transform: [
                  { perspective: 800 },
                  {
                    rotateY: tiltX.interpolate({
                      inputRange: [-TILT_INTENSITY, TILT_INTENSITY],
                      outputRange: [`-${TILT_INTENSITY}deg`, `${TILT_INTENSITY}deg`],
                    }),
                  },
                  {
                    rotateX: tiltY.interpolate({
                      inputRange: [-TILT_INTENSITY, TILT_INTENSITY],
                      outputRange: [`-${TILT_INTENSITY}deg`, `${TILT_INTENSITY}deg`],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                detailStyles.shine,
                {
                  opacity: tiltX.interpolate({
                    inputRange: [-TILT_INTENSITY, 0, TILT_INTENSITY],
                    outputRange: [0.15, 0, 0.15],
                  }),
                  transform: [
                    {
                      translateX: tiltX.interpolate({
                        inputRange: [-TILT_INTENSITY, TILT_INTENSITY],
                        outputRange: [-DETAIL_CARD_WIDTH * 0.5, DETAIL_CARD_WIDTH * 0.5],
                      }),
                    },
                  ],
                },
              ]}
            />
            {cardImage ? (
              <Image source={cardImage} style={detailStyles.image} resizeMode="cover" />
            ) : (
              <View style={[detailStyles.placeholder, { backgroundColor: isWolf ? "rgba(233,69,96,0.12)" : "rgba(15,52,96,0.7)" }]}>
                <Text style={detailStyles.emoji}>{roleDef.emoji}</Text>
              </View>
            )}
          </Animated.View>

          {/* Info */}
          <Animated.View
            style={[
              detailStyles.info,
              {
                opacity: contentOpacity,
                transform: [{ translateY: descTranslateY }],
              },
            ]}
          >
            <Text style={[detailStyles.name, { color: accentColor }]}>{roleDef.label}</Text>
            <Text style={detailStyles.description}>{roleDef.description}</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    width: DETAIL_CARD_WIDTH + 40,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    width: DETAIL_CARD_WIDTH,
    height: DETAIL_CARD_HEIGHT,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.4)",
    zIndex: 10,
    width: DETAIL_CARD_WIDTH * 0.6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 72,
  },
  info: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 8,
    width: SCREEN_WIDTH * 0.85,
  },
  name: {
    fontFamily: fonts.cinzelBold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
});

// --- Distribution Screen ---

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [detailVisible, setDetailVisible] = useState(false);

  // Gyroscope tilt on the revealed card (not in modal)
  const { tiltX, tiltY, TILT_INTENSITY } = useGyroscopeTilt(state.revealedRole);

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

  const handleLongPress = () => {
    if (state.revealedRole && role) {
      setDetailVisible(true);
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

              {/* Card with gyroscope tilt */}
              <Pressable onLongPress={handleLongPress} delayLongPress={400}>
                <Animated.View
                  style={[
                    styles.cardTiltWrapper,
                    {
                      transform: [
                        { perspective: 800 },
                        {
                          rotateY: tiltX.interpolate({
                            inputRange: [-TILT_INTENSITY, TILT_INTENSITY],
                            outputRange: [`-${TILT_INTENSITY}deg`, `${TILT_INTENSITY}deg`],
                          }),
                        },
                        {
                          rotateX: tiltY.interpolate({
                            inputRange: [-TILT_INTENSITY, TILT_INTENSITY],
                            outputRange: [`-${TILT_INTENSITY}deg`, `${TILT_INTENSITY}deg`],
                          }),
                        },
                      ],
                    },
                  ]}
                >
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
                </Animated.View>
              </Pressable>

              <Text style={styles.roleName}>
                {roleInfo?.label}
              </Text>

              <Text style={styles.longPressHint}>
                Maintiens la carte pour voir ton pouvoir
              </Text>

              <Pressable style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Suivant</Text>
              </Pressable>
            </>
          )}
        </View>
      </ImageBackground>

      <RoleDetailModal
        role={role}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
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
  cardTiltWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    marginTop: 20,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  longPressHint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginBottom: 20,
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
