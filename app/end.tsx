import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};

export default function EndScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const isWerewolfWin = state.winner === "werewolves";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Fin de partie", headerBackVisible: false }}
      />

      <View style={styles.header}>
        <Text style={styles.emoji}>{isWerewolfWin ? "🐺" : "🎉"}</Text>
        <Text style={styles.title}>
          {isWerewolfWin
            ? "Les Loups-Garous ont gagne !"
            : "Les Villageois ont gagne !"}
        </Text>
        <Text style={styles.subtitle}>
          Partie terminee en {state.turn} tour{state.turn > 1 ? "s" : ""}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recap des roles</Text>
      <FlatList
        data={state.players}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const roleInfo = item.role ? ROLE_LABELS[item.role] : null;
          return (
            <View
              style={[
                styles.playerRow,
                !item.isAlive && styles.playerDead,
              ]}
            >
              <Text style={styles.playerName}>
                {roleInfo?.emoji} {item.name}
              </Text>
              <View style={styles.playerDetails}>
                <Text style={styles.roleName}>{roleInfo?.label}</Text>
                <Text
                  style={[
                    styles.status,
                    item.isAlive ? styles.alive : styles.dead,
                  ]}
                >
                  {item.isAlive ? "Survivant" : "Mort"}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <Pressable
        style={styles.button}
        onPress={() => {
          dispatch({ type: "RESET_GAME" });
          router.replace("/");
        }}
      >
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
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
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerDead: {
    opacity: 0.5,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  playerDetails: {
    alignItems: "flex-end",
  },
  roleName: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "600",
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
  alive: {
    color: colors.success,
  },
  dead: {
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
