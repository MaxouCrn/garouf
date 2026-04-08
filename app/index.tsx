import { View, Text, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.5;

export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useGame();

  const handleNewGame = () => {
    dispatch({ type: "RESET_GAME" });
    router.push("/players-setup");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo-app.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Garouf</Text>
      <Text style={styles.subtitle}>Le jeu de la pause midi</Text>
      <Pressable style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontFamily: fonts.cinzelBold,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
});
