import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";

interface Props {
  alivePlayers: { id: string; name: string }[];
  myPlayerId: string;
  onVote: (targetId: string | null) => void;
}

export default function DayVoteView({ alivePlayers, myPlayerId, onVote }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const handleVote = () => {
    setVoted(true);
    onVote(selected);
  };

  const handleTimeout = () => {
    if (!voted) {
      setVoted(true);
      onVote(null); // Abstention
    }
  };

  const others = useMemo(
    () => alivePlayers.filter((p) => p.id !== myPlayerId),
    [alivePlayers, myPlayerId]
  );

  if (voted) {
    return (
      <View style={styles.container}>
        <Text style={styles.waiting}>Vote enregistre. En attente des autres...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vote</Text>
      <ActionTimer seconds={15} onExpire={handleTimeout} />
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
      <View style={styles.actions}>
        <Pressable style={styles.voteButton} onPress={handleVote}>
          <Text style={styles.buttonText}>{selected ? "Voter" : "S'abstenir"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.primary, textAlign: "center", marginBottom: 8 },
  waiting: { fontSize: 18, color: colors.textSecondary, textAlign: "center" },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  actions: { paddingTop: 12 },
  voteButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
