import { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, Animated } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { ROLE_CARDS, ROLE_LABELS } from "../../theme/roleCards";
import type { Role } from "../../game/roles";

const BACK_CARD = require("../../assets/cards/back-card.png");
const CARD_WIDTH = 220;
const CARD_HEIGHT = 330;

interface Props {
  role: string | null;
  description: string | null;
  isHost: boolean;
  onStartNight: () => void;
}

export default function DistributionView({ role, description, isHost, onStartNight }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const roleKey = role as Role | null;
  const roleLabel = roleKey ? ROLE_LABELS[roleKey] : null;
  const roleCard = roleKey ? ROLE_CARDS[roleKey] : null;

  if (!role) {
    return (
      <View style={styles.container}>
        <Text style={styles.waiting}>Attribution des roles en cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ton Role</Text>

      {!revealed ? (
        <>
          <Pressable onPress={() => setRevealed(true)}>
            <Image source={BACK_CARD} style={styles.card} resizeMode="contain" />
          </Pressable>
          <Text style={styles.hint}>Appuie pour retourner ta carte</Text>
        </>
      ) : (
        <>
          <Pressable
            onLongPress={() => setShowDescription(true)}
            onPressOut={() => setShowDescription(false)}
          >
            {roleCard ? (
              <Image source={roleCard} style={styles.card} resizeMode="contain" />
            ) : (
              <View style={styles.emojiCard}>
                <Text style={styles.emoji}>{roleLabel?.emoji ?? "?"}</Text>
                <Text style={styles.roleName}>{roleLabel?.label ?? role}</Text>
              </View>
            )}
          </Pressable>

          {showDescription && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          )}

          {!showDescription && (
            <Text style={styles.hint}>Maintiens appuye pour voir la description</Text>
          )}
        </>
      )}

      {isHost && revealed && (
        <Pressable style={styles.startButton} onPress={onStartNight}>
          <Text style={styles.startButtonText}>Tout le monde est pret</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 24,
  },
  waiting: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
  },
  emojiCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  roleName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 16,
  },
  descriptionBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    maxWidth: 300,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  startButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
