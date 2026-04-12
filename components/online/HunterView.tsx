import { useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import GButton from "../GButton";
import GlassRow from "../GlassRow";

interface Props {
  isHunter: boolean;
  alivePlayers: { id: string; name: string }[];
  myPlayerId: string;
  onShoot: (targetId: string | null) => void;
}

export default function HunterView({ isHunter, alivePlayers, myPlayerId, onShoot }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!isHunter) {
    return (
      <View style={styles.waitContainer}>
        <Text style={styles.waitEmoji}>{"\u{1F3F9}"}</Text>
        <Text style={styles.waitTitle}>Le Chasseur choisit sa cible...</Text>
        <Text style={styles.waitSub}>Un dernier tir avant de partir</Text>
        <ActivityIndicator size="small" color={colors.danger} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  const others = alivePlayers.filter((p) => p.id !== myPlayerId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu es le Chasseur !</Text>
      <Text style={styles.instruction}>Tu as ete elimine. Choisis un joueur a emporter avec toi.</Text>
      <ActionTimer seconds={15} onExpire={() => onShoot(null)} />
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected === item.id;
          return (
            <GlassRow
              selected={isSelected}
              selectedColor={colors.danger}
              onPress={() => setSelected(item.id)}
            >
              <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.playerName, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
            </GlassRow>
          );
        }}
      />
      <GButton variant="danger" onPress={() => onShoot(selected)} disabled={!selected}>
        Tirer
      </GButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  instruction: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  list: { flex: 1, marginTop: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: "rgba(232,93,93,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,93,93,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: {
    backgroundColor: "rgba(232,93,93,0.15)",
    borderColor: colors.danger,
  },
  avatarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.danger,
  },
  playerName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.text,
  },
  selectedText: { color: colors.white },
  // Wait state (non-hunter)
  waitContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  waitEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: spacing.base,
  },
  waitTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  waitSub: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
