import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../../lib/supabase";
import { useChannel } from "../../hooks/useChannel";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { getPreset } from "../../game/balance";
import { ROLE_REGISTRY, type Role } from "../../game/roles";
import type { LobbyPlayer, LobbyUpdatePayload } from "../../types/online";

const ROLE_LABELS: Record<Role, string> = {
  werewolf: "Loup-Garou",
  villager: "Villageois",
  seer: "Voyante",
  witch: "Sorciere",
  hunter: "Chasseur",
  cupid: "Cupidon",
  little_girl: "Petite Fille",
  savior: "Salvateur",
  elder: "Ancien",
  raven: "Corbeau",
  village_idiot: "Idiot du Village",
};

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

      {/* Code + QR */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Code de la partie</Text>
        <Text style={styles.code}>{params.code}</Text>
        <View style={styles.qrContainer}>
          <QRCode
            value={deepLink}
            size={140}
            backgroundColor="transparent"
            color={colors.text}
          />
        </View>
      </View>

      {/* Player list */}
      <Text style={styles.sectionTitle}>Joueurs ({players.length})</Text>
      {players.length === 0 ? (
        <Text style={styles.emptyText}>En attente de joueurs...</Text>
      ) : (
        players.map((item) => (
          <View key={item.id} style={styles.playerRow}>
            <Text style={styles.playerName}>
              {item.name} {item.isHost ? "👑" : ""}
            </Text>
          </View>
        ))
      )}

      {/* Role configuration (host only) */}
      {isHost && (
        <View style={styles.rolesSection}>
          <Text style={styles.sectionTitle}>
            Roles ({totalRoles}/{players.length})
          </Text>
          {totalRoles !== players.length && players.length > 0 && (
            <Text style={styles.warning}>
              Ajuste les roles pour correspondre au nombre de joueurs
            </Text>
          )}
          <Pressable
            style={styles.presetButton}
            onPress={() => {
              if (players.length >= 6) setRoleConfig(getPreset(players.length));
              else Alert.alert("Preset", "Les presets sont disponibles a partir de 6 joueurs.");
            }}
          >
            <Text style={styles.presetButtonText}>Preset auto</Text>
          </Pressable>
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <View key={role} style={styles.roleRow}>
              <Text style={styles.roleName}>
                {ROLE_REGISTRY[role].emoji} {ROLE_LABELS[role]}
              </Text>
              <View style={styles.roleControls}>
                <Pressable
                  style={styles.roleButton}
                  onPress={() => adjustRole(role, -1)}
                >
                  <Text style={styles.roleButtonText}>-</Text>
                </Pressable>
                <Text style={styles.roleCount}>{roleConfig[role]}</Text>
                <Pressable
                  style={styles.roleButton}
                  onPress={() => adjustRole(role, 1)}
                >
                  <Text style={styles.roleButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {isHost && (
          <Pressable
            style={[
              styles.startButton,
              (totalRoles !== players.length || players.length < 2 || loading) &&
                styles.buttonDisabled,
            ]}
            onPress={handleStart}
            disabled={totalRoles !== players.length || players.length < 2 || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.startButtonText}>Lancer la partie</Text>
            )}
          </Pressable>
        )}
        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Quitter</Text>
        </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  codeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  code: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 8,
    marginBottom: 16,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  playerRow: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    color: colors.text,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  rolesSection: {
    marginTop: 8,
  },
  warning: {
    color: colors.warning,
    fontSize: 14,
    marginBottom: 8,
  },
  presetButton: {
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  presetButtonText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  roleName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  roleControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  roleButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  roleCount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  actions: {
    paddingVertical: 16,
    gap: 12,
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  leaveButtonText: {
    color: colors.danger,
    fontSize: 16,
  },
});
