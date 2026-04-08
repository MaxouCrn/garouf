import { Text, Image, ImageBackground, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";

const LOGO_SIZE = 550;

export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useGame();

  const handleNewGame = () => {
    dispatch({ type: "RESET_GAME" });
    router.push("/players-setup");
  };

  return (
    <ImageBackground
      source={require("../assets/fond-home.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <Image
        source={require("../assets/logo-app.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>Le jeu de la pause midi</Text>
      <Pressable style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    padding: 24,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 24,
    marginBottom: 16,
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
