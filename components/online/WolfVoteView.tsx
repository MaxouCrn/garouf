import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  wolfVotes: Record<string, number>;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function WolfVoteView({ action, wolfVotes, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (targetId: string) => {
    setSelected(targetId);
    onSubmit("werewolf_target", { targetId });
  };

  const handleTimeout = () => {
    if (!selected) {
      const firstTarget = action.targets[0];
      if (firstTarget) onSubmit("werewolf_target", { targetId: firstTarget.id });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{action.instruction}</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />
      <FlatList
        data={action.targets}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const voteCount = wolfVotes[item.id] || 0;
          const isSelected = selected === item.id;
          return (
            <Pressable
              style={[styles.playerRow, isSelected && styles.selected]}
              onPress={() => handleSelect(item.id)}
            >
              <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.playerName, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
              {voteCount > 0 && (
                <Text style={styles.voteCount}>
                  {"🐺".repeat(voteCount)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  instruction: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  selectedText: {
    color: colors.white,
  },
  voteCount: {
    fontSize: 16,
    marginLeft: "auto",
  },
});
