import { useState, useRef, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  ImageBackground,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_REGISTRY, RoleDefinition } from "../game/roles";
import { ROLE_CARDS } from "../theme/roleCards";
import { useGyroscopeTilt } from "../hooks/useGyroscopeTilt";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 10;
const GRID_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const EXPANDED_CARD_WIDTH = SCREEN_WIDTH * 0.6;
const EXPANDED_CARD_HEIGHT = EXPANDED_CARD_WIDTH * 1.45;

function getInterventionLabel(role: RoleDefinition): string {
  if (role.firstNightOnly) return "1re nuit";
  if (role.nightOrder !== null && role.activeEveryOtherNight) return "Nuit (1/2)";
  if (role.nightOrder !== null) return "Nuit";
  if (role.id === "village_idiot") return "Jour";
  if (role.id === "hunter") return "A sa mort";
  return "Passif";
}

// --- Grid Card ---

function GridCard({
  role,
  onPress,
}: {
  role: RoleDefinition;
  onPress: () => void;
}) {
  const cardImage = ROLE_CARDS[role.id];
  const isWolf = role.camp === "werewolves";

  return (
    <Pressable style={styles.gridCard} onPress={onPress}>
      <View style={[styles.gridCardInner, { borderColor: isWolf ? "rgba(233,69,96,0.3)" : "rgba(212,160,23,0.2)" }]}>
        {cardImage ? (
          <Image source={cardImage} style={styles.gridCardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.gridCardPlaceholder, { backgroundColor: isWolf ? "rgba(233,69,96,0.1)" : "rgba(15,52,96,0.6)" }]}>
            <Text style={styles.gridCardEmoji}>{role.emoji}</Text>
          </View>
        )}
        <View style={styles.gridCardLabelArea}>
          <Text style={styles.gridCardLabel} numberOfLines={2}>
            {role.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// --- Expanded Card Modal ---

function ExpandedCardModal({
  role,
  visible,
  onClose,
}: {
  role: RoleDefinition | null;
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

  const cardImage = ROLE_CARDS[role.id];
  const isWolf = role.camp === "werewolves";
  const accentColor = isWolf ? colors.danger : colors.primary;
  const intervention = getInterventionLabel(role);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={animateIn}
      onRequestClose={animateOut}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.modalBackdrop} onPress={animateOut}>
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]} />
      </Pressable>

      {/* Content */}
      <View style={styles.modalContent} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.expandedContainer,
            { transform: [{ scale: cardScale }] },
          ]}
        >
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={animateOut}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          {/* Card with gyroscope tilt */}
          <Animated.View
            style={[
              styles.expandedCard,
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
            {/* Shine / light reflection overlay */}
            <Animated.View
              style={[
                styles.cardShine,
                {
                  opacity: tiltX.interpolate({
                    inputRange: [-TILT_INTENSITY, 0, TILT_INTENSITY],
                    outputRange: [0.15, 0, 0.15],
                  }),
                  transform: [
                    {
                      translateX: tiltX.interpolate({
                        inputRange: [-TILT_INTENSITY, TILT_INTENSITY],
                        outputRange: [-EXPANDED_CARD_WIDTH * 0.5, EXPANDED_CARD_WIDTH * 0.5],
                      }),
                    },
                  ],
                },
              ]}
            />
            {cardImage ? (
              <Image source={cardImage} style={styles.expandedImage} resizeMode="cover" />
            ) : (
              <View style={[styles.expandedPlaceholder, { backgroundColor: isWolf ? "rgba(233,69,96,0.12)" : "rgba(15,52,96,0.7)" }]}>
                <Text style={styles.expandedEmoji}>{role.emoji}</Text>
              </View>
            )}
          </Animated.View>

          {/* Info below card — appears with card */}
          <Animated.View
            style={[
              styles.expandedInfo,
              {
                opacity: contentOpacity,
                transform: [{ translateY: descTranslateY }],
              },
            ]}
          >
            <Text style={[styles.expandedName, { color: accentColor }]}>{role.label}</Text>

            <View style={styles.expandedBadges}>
              <View style={[styles.expandedBadge, { backgroundColor: `${accentColor}25` }]}>
                <Text style={[styles.expandedBadgeText, { color: accentColor }]}>
                  {isWolf ? "Loups-Garous" : "Village"}
                </Text>
              </View>
              <View style={[styles.expandedBadge, { backgroundColor: "rgba(58,95,138,0.25)" }]}>
                <Text style={[styles.expandedBadgeText, { color: colors.wolfBlue }]}>
                  {intervention}
                </Text>
              </View>
            </View>

            <Text style={styles.expandedDescription}>{role.description}</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// --- Section Header ---

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionLine, { backgroundColor: color }]} />
      <View style={styles.sectionLabelArea}>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <View style={[styles.sectionLine, { backgroundColor: color }]} />
    </View>
  );
}

// --- Main Screen ---

export default function GrimoireScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const villageRoles = Object.values(ROLE_REGISTRY).filter((r) => r.camp === "village");
  const werewolfRoles = Object.values(ROLE_REGISTRY).filter((r) => r.camp === "werewolves");

  const handleCardPress = (role: RoleDefinition) => {
    setSelectedRole(role);
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setSelectedRole(null);
  };

  const renderGrid = (roles: RoleDefinition[]) => {
    const rows: RoleDefinition[][] = [];
    for (let i = 0; i < roles.length; i += 3) {
      rows.push(roles.slice(i, i + 3));
    }
    return rows.map((row, rowIdx) => (
      <View key={rowIdx} style={styles.gridRow}>
        {row.map((role) => (
          <GridCard key={role.id} role={role} onPress={() => handleCardPress(role)} />
        ))}
        {row.length < 3 &&
          Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.gridCard} />
          ))}
      </View>
    ));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={require("../assets/fond-home.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Retour</Text>
            </Pressable>

            <Text style={styles.title}>Grimoire</Text>
            <Text style={styles.subtitle}>Touche une carte pour decouvrir son pouvoir</Text>

            <SectionHeader title="Village" color={colors.primary} />
            {renderGrid(villageRoles)}

            <SectionHeader title="Loups-Garous" color={colors.danger} />
            {renderGrid(werewolfRoles)}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </ImageBackground>

      <ExpandedCardModal
        role={selectedRole}
        visible={modalVisible}
        onClose={handleClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.85)",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 32,
    color: colors.primary,
    textAlign: "center",
    textShadowColor: "rgba(212,160,23,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 20,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    opacity: 0.4,
  },
  sectionLabelArea: {
    marginHorizontal: 14,
  },
  sectionTitle: {
    fontFamily: fonts.cinzelBold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Grid
  gridRow: {
    flexDirection: "row",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
  },
  gridCardInner: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(22,33,62,0.9)",
  },
  gridCardImage: {
    width: "100%",
    height: CARD_HEIGHT,
  },
  gridCardPlaceholder: {
    width: "100%",
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardEmoji: {
    fontSize: 38,
  },
  gridCardLabelArea: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  gridCardLabel: {
    fontFamily: fonts.cinzelBold,
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContainer: {
    alignItems: "center",
    width: EXPANDED_CARD_WIDTH + 40,
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
  expandedCard: {
    width: EXPANDED_CARD_WIDTH,
    height: EXPANDED_CARD_HEIGHT,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  cardShine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.4)",
    zIndex: 10,
    width: EXPANDED_CARD_WIDTH * 0.6,
  },
  expandedImage: {
    width: "100%",
    height: "100%",
  },
  expandedPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  expandedEmoji: {
    fontSize: 72,
  },
  expandedInfo: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 8,
    width: SCREEN_WIDTH * 0.85,
  },
  expandedName: {
    fontFamily: fonts.cinzelBold,
    fontSize: 24,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  expandedBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  expandedBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  expandedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expandedDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  bottomPadding: {
    height: 20,
  },
});
