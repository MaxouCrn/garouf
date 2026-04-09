import { useEffect } from "react";
import { Text, Image, ImageBackground, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { useMusicContext } from "../context/MusicContext";
import { colors } from "../theme/colors";
import FogEffect from "../components/FogEffect";
import MuteButton from "../components/MuteButton";

const LOGO_SIZE = 350;

export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useGame();
  const { startMusic } = useMusicContext();

  useEffect(() => {
    startMusic();
  }, []);

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
      <MuteButton />
      <FogEffect />
      <Image
        source={require("../assets/logo-app.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>Le jeu de la pause du midi</Text>
      <Pressable style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
      <Pressable style={styles.outlineButton} onPress={() => router.push("/grimoire")}>
        <Text style={styles.outlineButtonText}>Grimoire des Rôles</Text>
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
    paddingTop: 100,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 48,
    marginTop: 48,
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
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
});
