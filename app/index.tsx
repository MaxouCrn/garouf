import { useEffect } from "react";
import { Text, Image, ImageBackground, View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGame } from "../context/GameContext";
import { useMusicContext } from "../context/MusicContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import FogEffect from "../components/FogEffect";
import MuteButton from "../components/MuteButton";
import GButton from "../components/GButton";

const LOGO_SIZE = 300;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../assets/logo-app.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Le jeu de la pause du midi</Text>
        <View style={styles.divider} />
        <View style={styles.btnGroup}>
          <GButton variant="primary" onPress={handleNewGame}>
            Nouvelle partie
          </GButton>
          <GButton variant="outline" onPress={() => router.push("/grimoire")}>
            Grimoire des Roles
          </GButton>
          <GButton
            variant="outline"
            onPress={() => router.push("/online/create")}
          >
            Creer une partie en ligne
          </GButton>
          <GButton
            variant="outline"
            onPress={() => router.push("/online/join")}
          >
            Rejoindre une partie
          </GButton>
          {__DEV__ && (
            <GButton
              variant="danger"
              onPress={() => router.push("/dev")}
              style={{ marginTop: 16 }}
            >
              Dev Tools
            </GButton>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    alignItems: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tagline: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  divider: {
    width: 50,
    height: 1,
    backgroundColor: colors.accentDim,
    marginVertical: 20,
  },
  btnGroup: {
    width: 260,
    gap: 10,
  },
});
