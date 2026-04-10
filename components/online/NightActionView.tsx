import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function NightActionView({ action, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    const actionMap: Record<string, string> = {
      seer: "seer_inspect",
      savior: "savior_protect",
      raven: "raven_mark",
    };
    const actionType = actionMap[action.step] || action.step;
    onSubmit(actionType, { targetId: selected });
  };

  const handleTimeout = () => {
    // Default action: do nothing
    const actionMap: Record<string, string> = {
      seer: "seer_inspect",
      savior: "savior_protect",
      raven: "raven_mark",
    };
    const actionType = actionMap[action.step] || action.step;
    onSubmit(actionType, { targetId: null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{action.instruction}</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />
      <FlatList
        data={action.targets}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.playerRow, selected === item.id && styles.selected]}
            onPress={() => setSelected(item.id)}
          >
            <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Confirmer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  instruction: { fontSize: 18, color: colors.text, textAlign: "center", marginBottom: 8 },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.primary },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.black },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
