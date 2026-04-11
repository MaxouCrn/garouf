import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase, ensureAnonymousSession } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import GButton from "../../components/GButton";
import GInput from "../../components/GInput";

export default function CreateGameScreen() {
  const router = useRouter();
  const [name, setName] = useState(__DEV__ ? "Host" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (name.trim().length === 0) return;
    setLoading(true);
    setError(null);

    try {
      await ensureAnonymousSession();

      const { data, error: fnError } = await supabase.functions.invoke("create-game", {
        body: {
          name: name.trim(),
          settings: { selectedRoles: [], debateTimerMinutes: 3 },
          ...(__DEV__ ? { devCode: "DEV001" } : {}),
        },
      });

      if (fnError) throw fnError;

      router.replace({
        pathname: "/online/lobby",
        params: {
          gameId: data.gameId,
          code: data.code,
          playerId: data.playerId,
          isHost: "true",
        },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creer une partie</Text>
      <GInput
        label="Ton pseudo"
        value={name}
        onChangeText={setName}
        placeholder="Entre ton pseudo..."
        maxLength={20}
        autoFocus
        error={error || undefined}
      />
      <GButton
        variant="primary"
        onPress={handleCreate}
        disabled={!name.trim() || loading}
        loading={loading}
      >
        Creer le salon
      </GButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
});
