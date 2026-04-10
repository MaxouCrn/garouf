import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";

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
        <Text style={styles.waiting}>Le Chasseur choisit sa cible...</Text>
      </View>
    );
  }

  const others = alivePlayers.filter((p) => p.id !== myPlayerId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu es le Chasseur !</Text>
      <Text style={styles.instruction}>Choisis qui emporter avec toi.</Text>
      <ActionTimer seconds={15} onExpire={() => onShoot(null)} />
      <FlatList
        data={others}
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
        onPress={() => onShoot(selected)}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Tirer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: colors.danger, textAlign: "center", marginBottom: 8 },
  instruction: { fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 8 },
  waiting: { fontSize: 18, color: colors.textSecondary, textAlign: "center" },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  button: { backgroundColor: colors.danger, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "bold" },
});
