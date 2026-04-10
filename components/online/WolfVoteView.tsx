import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
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
      // Pick first target as default
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
          return (
            <Pressable
              style={[styles.playerRow, selected === item.id && styles.selected]}
              onPress={() => handleSelect(item.id)}
            >
              <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
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
  container: { flex: 1, padding: 24 },
  instruction: { fontSize: 18, color: colors.text, textAlign: "center", marginBottom: 8 },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  voteCount: { fontSize: 16 },
});
