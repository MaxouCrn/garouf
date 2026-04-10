import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../../lib/supabase";
import { useChannel } from "../../hooks/useChannel";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { LobbyPlayer, LobbyUpdatePayload } from "../../types/online";

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

  const onMessage = {
    "lobby:update": useCallback((payload: Record<string, unknown>) => {
      const data = payload as unknown as LobbyUpdatePayload;
      setPlayers(data.players);
    }, []),
    "game:phase": useCallback((payload: Record<string, unknown>) => {
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
    }, [router, params]),
  };

  useChannel({
    channelName: `game:${params.gameId}`,
    onMessage,
  });

  const handleLeave = async () => {
    await supabase.functions.invoke("leave-game", {
      body: { gameId: params.gameId },
    });
    router.replace("/");
  };

  const handleStart = async () => {
    if (players.length < 6) {
      Alert.alert("Pas assez de joueurs", "Il faut au moins 6 joueurs pour commencer.");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("start-game", {
        body: {
          gameId: params.gameId,
          settings: {
            selectedRoles: [],
            debateTimerMinutes: 3,
          },
        },
      });

      if (error) throw error;

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
    }
  };

  const deepLink = `loupgarou://join?code=${params.code}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Salon</Text>

      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Code de la partie</Text>
        <Text style={styles.code}>{params.code}</Text>
        <View style={styles.qrContainer}>
          <QRCode value={deepLink} size={160} backgroundColor="transparent" color={colors.text} />
        </View>
      </View>

      <Text style={styles.playersTitle}>
        Joueurs ({players.length})
      </Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>
              {item.name} {item.isHost ? "👑" : ""}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>En attente de joueurs...</Text>
        }
      />

      <View style={styles.actions}>
        {isHost && (
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Lancer la partie</Text>
          </Pressable>
        )}
        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Quitter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 20,
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
  playersTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "bold",
    marginBottom: 8,
  },
  list: {
    flex: 1,
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
    marginTop: 20,
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
