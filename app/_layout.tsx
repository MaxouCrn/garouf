import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "../context/GameContext";
import { colors } from "../theme/colors";

export default function RootLayout() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
    </GameProvider>
  );
}
