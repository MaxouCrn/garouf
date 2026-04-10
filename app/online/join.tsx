import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, ensureAnonymousSession } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { CODE_LENGTH } from "../../types/online";

export default function JoinGameScreen() {
  const router = useRouter();
  const urlParams = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(() => {
    if (__DEV__) return urlParams.code?.toUpperCase() || "DEV001";
    return "";
  });
  const [name, setName] = useState(__DEV__ ? `Bot ${Date.now() % 1000}` : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev mode: auto-join on mount
  const autoJoinDone = useRef(false);
  useEffect(() => {
    if (__DEV__ && !autoJoinDone.current && code.trim().length === CODE_LENGTH && name.trim().length > 0) {
      autoJoinDone.current = true;
      handleJoin();
    }
  }, []);

  const handleJoin = async () => {
    if (code.trim().length !== CODE_LENGTH || name.trim().length === 0) return;
    setLoading(true);
    setError(null);

    try {
      await ensureAnonymousSession();

      const { data, error: fnError } = await supabase.functions.invoke("join-game", {
        body: { code: code.trim().toUpperCase(), name: name.trim() },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      router.replace({
        pathname: "/online/lobby",
        params: {
          gameId: data.gameId,
          code: code.trim().toUpperCase(),
          playerId: data.playerId,
          isHost: "false",
        },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const canJoin = code.trim().length === CODE_LENGTH && name.trim().length > 0 && !loading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejoindre une partie</Text>

      <Text style={styles.label}>Code de la partie</Text>
      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="LOUP42"
        placeholderTextColor={colors.textMuted}
        maxLength={CODE_LENGTH}
        autoCapitalize="characters"
        autoFocus
      />

      <Text style={styles.label}>Ton pseudo</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Entre ton pseudo..."
        placeholderTextColor={colors.textMuted}
        maxLength={20}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, !canJoin && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={!canJoin}
      >
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.buttonText}>Rejoindre</Text>
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
  codeInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "bold",
    marginBottom: 24,
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
