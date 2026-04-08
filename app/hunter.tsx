import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

export default function HunterScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const hunter = state.players.find(
    (p) => p.role === "hunter" && !p.isAlive
  );

  const handleShoot = (playerId: string) => {
    dispatch({ type: "HUNTER_SHOOT", playerId });
  };

  // After HUNTER_SHOOT, phase changes — navigate via useEffect
  useEffect(() => {
    if (state.phase === "day") router.replace("/day");
    else if (state.phase === "night") router.replace("/night");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Chasseur", headerBackVisible: false }}
      />

      <View style={styles.header}>
        <Text style={styles.emoji}>🏹</Text>
        <Text style={styles.title}>
          {hunter?.name} etait le Chasseur !
        </Text>
        <Text style={styles.subtitle}>
          Avant de mourir, il peut emporter quelqu'un avec lui.
        </Text>
      </View>

      <FlatList
        data={alivePlayers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.playerOption}
            onPress={() => handleShoot(item.id)}
          >
            <Text style={styles.playerOptionText}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    padding: 24,
    paddingTop: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  playerOption: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerOptionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
