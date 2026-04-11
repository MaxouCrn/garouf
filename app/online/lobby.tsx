import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../../lib/supabase";
import { useChannel } from "../../hooks/useChannel";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import { getPreset } from "../../game/balance";
import { ROLE_REGISTRY, type Role } from "../../game/roles";
import type { LobbyPlayer, LobbyUpdatePayload } from "../../types/online";
import GButton from "../../components/GButton";
import GPlayerRow from "../../components/GPlayerRow";
import GRoleCardGrid from "../../components/GRoleCardGrid";

function WaitingSpinner() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.waitingBox}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
      <Text style={styles.waitingText}>En attente du lancement...</Text>
      <Text style={styles.waitingHint}>L'hote configure la partie</Text>
    </View>
  );
}

export default function LobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    gameId: string;
    code: string;
    playerId: string;
    isHost: string;
  }>();

  const isHost = params.isHost === "true";
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  // Role configuration (host only)
  const [roleConfig, setRoleConfig] = useState<Record<Role, number>>(() => getPreset(6));

  // Fetch player list on mount + poll every 3s for reliability
  useEffect(() => {
    let mounted = true;

    async function fetchPlayers() {
      const { data: game } = await supabase
        .from("games")
        .select("host_id")
        .eq("id", params.gameId)
        .single();

      const { data: allPlayers } = await supabase
        .from("players")
        .select("id, name")
        .eq("game_id", params.gameId)
        .order("joined_at", { ascending: true });

      if (allPlayers && mounted) {
        const lobbyPlayers: LobbyPlayer[] = allPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.id === game?.host_id,
        }));
        setPlayers(lobbyPlayers);
      }
    }

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [params.gameId]);

  const onMessage = {
    "lobby:update": useCallback((payload: Record<string, unknown>) => {
      const data = payload as unknown as LobbyUpdatePayload;
      setPlayers(data.players);
    }, []),
    "game:phase": useCallback(
      (payload: Record<string, unknown>) => {
        if ((payload as any).phase === "distribution") {
          router.replace({
            pathname: "/online/game",
            params: {
              gameId: params.gameId,
              playerId: params.playerId,
              isHost: params.isHost,
            },
          });
        }
      },
      [router, params]
    ),
  };

  useChannel({
    channelName: `game:${params.gameId}`,
    onMessage,
  });

  // Update preset when player count changes
  useEffect(() => {
    if (isHost && players.length >= (__DEV__ ? 2 : 6)) {
      setRoleConfig(getPreset(players.length));
    }
  }, [players.length, isHost]);

  const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);

  const adjustRole = (role: Role, delta: number) => {
    setRoleConfig((prev) => {
      const def = ROLE_REGISTRY[role];
      const newCount = Math.max(def.min, Math.min(def.max, prev[role] + delta));
      return { ...prev, [role]: newCount };
    });
  };

  const handleLeave = async () => {
    await supabase.functions.invoke("leave-game", {
      body: { gameId: params.gameId },
    });
    router.replace("/");
  };

  const handleStart = async () => {
    if (players.length < 2) {
      Alert.alert("Pas assez de joueurs", "Il faut au moins 2 joueurs pour tester.");
      return;
    }

    if (totalRoles !== players.length) {
      Alert.alert(
        "Roles incorrects",
        `Tu as configure ${totalRoles} roles pour ${players.length} joueurs. Les deux nombres doivent correspondre.`
      );
      return;
    }

    setLoading(true);
    try {
      const selectedRoles: { role: Role; count: number }[] = [];
      for (const [role, count] of Object.entries(roleConfig)) {
        if (count > 0) {
          selectedRoles.push({ role: role as Role, count });
        }
      }

      const { data, error } = await supabase.functions.invoke("start-game", {
        body: {
          gameId: params.gameId,
          settings: {
            selectedRoles,
            debateTimerMinutes: 3,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      router.replace({
        pathname: "/online/game",
        params: {
          gameId: params.gameId,
          playerId: params.playerId,
          isHost: "true",
        },
      });
    } catch (err) {
      Alert.alert("Erreur", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deepLink = `loupgarou://join?code=${params.code}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Salon</Text>

      {/* Code + QR with corner accents */}
      <View style={styles.codeBox}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Text style={styles.codeLabel}>Code de la partie</Text>
        <Text style={styles.codeValue}>{params.code}</Text>
        <View style={styles.qrContainer}>
          <QRCode
            value={deepLink}
            size={120}
            backgroundColor="transparent"
            color={colors.text}
          />
        </View>
      </View>

      {/* Players */}
      <Text style={styles.sectionTitle}>Joueurs ({players.length})</Text>
      {players.length === 0 ? (
        <Text style={styles.emptyText}>En attente de joueurs...</Text>
      ) : (
        players.map((item) => (
          <GPlayerRow
            key={item.id}
            name={item.name}
            avatarLetter={item.name.charAt(0).toUpperCase()}
            badge={item.isHost ? { text: "Hote", variant: "host" } : undefined}
            highlighted={item.id === params.playerId}
          />
        ))
      )}

      {/* Role configuration (host only) — card grid */}
      {isHost && (
        <GRoleCardGrid
          roleConfig={roleConfig}
          totalPlayers={players.length}
          onAdjust={adjustRole}
          onPreset={() => {
            if (players.length >= 6) setRoleConfig(getPreset(players.length));
            else Alert.alert("Preset", "Les presets sont disponibles a partir de 6 joueurs.");
          }}
        />
      )}

      {/* Non-host waiting state */}
      {!isHost && <WaitingSpinner />}

      {/* Actions */}
      <View style={styles.actions}>
        {isHost && (
          <GButton
            variant="primary"
            onPress={handleStart}
            disabled={totalRoles !== players.length || players.length < 2 || loading}
            loading={loading}
          >
            Lancer la partie
          </GButton>
        )}
        <GButton variant="danger" onPress={handleLeave}>
          Quitter
        </GButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  // Code box with corner accents
  codeBox: {
    alignItems: "center",
    marginBottom: spacing.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: colors.accent,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  codeLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  codeValue: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.accent,
    letterSpacing: 8,
    marginBottom: spacing.md,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.base,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
  emptyText: {
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  // Non-host waiting
  waitingBox: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  spinner: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: colors.accentDim,
    borderTopColor: colors.accent,
    borderRadius: 16,
    marginBottom: spacing.base,
  },
  waitingText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  waitingHint: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
});
