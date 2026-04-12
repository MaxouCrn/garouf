import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import GButton from "../GButton";

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
      <View style={styles.container}>
        <Text style={styles.waitEmoji}>🏹</Text>
        <Text style={styles.waiting}>Le Chasseur choisit sa cible...</Text>
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
            <Pressable
              style={[styles.playerRow, isSelected && styles.selected]}
              onPress={() => setSelected(item.id)}
            >
              <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.playerName, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
            </Pressable>
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
  waitEmoji: { fontSize: 48, textAlign: "center", marginBottom: spacing.base },
  waiting: {
    fontFamily: fonts.bodyRegular,
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: { flex: 1, marginTop: spacing.md },
  playerRow: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.base,
    borderRadius: radii.base,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selected: {
    borderColor: colors.danger,
    backgroundColor: "rgba(232,93,93,0.08)",
  },
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
});
