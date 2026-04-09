import { View, Text, Image, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";
import { ROLE_CARDS, ROLE_LABELS } from "../theme/roleCards";

export default function EndScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const isWerewolfWin = state.winner === "werewolves";

  return (
    <>
      <Stack.Screen
        options={{ title: "Fin de partie", headerBackVisible: false }}
      />
      <CardFrame
        title={isWerewolfWin ? "Victoire des Loups" : "Victoire du Village"}
        subtitle={`Partie en ${state.turn} tour${state.turn > 1 ? "s" : ""}`}
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>{isWerewolfWin ? "🐺" : "🎉"}</Text>
          <Text style={styles.title}>
            {isWerewolfWin
              ? "Les Loups-Garous ont gagne !"
              : "Les Villageois ont gagne !"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recap des roles</Text>
        <FlatList
          data={state.players}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => {
            const roleInfo = item.role ? ROLE_LABELS[item.role] : null;
            const cardImage = item.role ? ROLE_CARDS[item.role] : null;
            return (
              <View
                style={[
                  styles.playerRow,
                  !item.isAlive && styles.playerDead,
                ]}
              >
                <View style={styles.playerLeft}>
                  {cardImage ? (
                    <Image source={cardImage} style={styles.cardThumb} resizeMode="cover" />
                  ) : (
                    <Text style={styles.cardEmoji}>{roleInfo?.emoji}</Text>
                  )}
                  <Text style={styles.playerName}>{item.name}</Text>
                </View>
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
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerDead: {
    opacity: 0.5,
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardThumb: {
    width: 36,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  playerDetails: {
    alignItems: "flex-end",
  },
  roleName: {
    color: colors.ember,
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
    marginTop: 16,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
