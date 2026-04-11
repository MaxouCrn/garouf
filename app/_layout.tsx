import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { GameProvider } from "../context/GameContext";
import { MusicProvider } from "../context/MusicContext";
import { colors } from "../theme/colors";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "splash",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GameProvider>
      <MusicProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="online" options={{ headerShown: false }} />
          <Stack.Screen name="dev" options={{ headerShown: false }} />
        </Stack>
      </MusicProvider>
    </GameProvider>
  );
}
