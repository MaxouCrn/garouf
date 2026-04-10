import { Stack } from "expo-router";
import { colors } from "../../theme/colors";

export default function OnlineLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="create" options={{ title: "Creer une partie" }} />
      <Stack.Screen name="join" options={{ title: "Rejoindre" }} />
      <Stack.Screen name="lobby" options={{ title: "Salon", headerBackVisible: false }} />
      <Stack.Screen name="game" options={{ title: "Partie", headerShown: false }} />
    </Stack>
  );
}
