import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase, ensureAnonymousSession } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function CreateGameScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
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
      <Text style={styles.label}>Ton pseudo</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Entre ton pseudo..."
        placeholderTextColor={colors.textMuted}
        maxLength={20}
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, (!name.trim() || loading) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.buttonText}>Creer le salon</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  error: {
    color: colors.danger,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
});
