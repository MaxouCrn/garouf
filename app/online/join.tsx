import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase, ensureAnonymousSession } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import { CODE_LENGTH } from "../../types/online";
import GButton from "../../components/GButton";
import GInput from "../../components/GInput";

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

      <GInput
        label="Ton pseudo"
        value={name}
        onChangeText={setName}
        placeholder="Entre ton pseudo..."
        maxLength={20}
        error={error || undefined}
      />

      <GButton
        variant="primary"
        onPress={handleJoin}
        disabled={!canJoin}
        loading={loading}
      >
        Rejoindre
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
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  codeInput: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: 16,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
    letterSpacing: 8,
    fontFamily: fonts.displayBold,
    marginBottom: spacing.xl,
  },
});
