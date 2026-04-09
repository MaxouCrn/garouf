import { useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Audio } from "expo-av";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

const GUNFIRE_SFX = require("../assets/sounds/bruitages/gunfire-chasseur.mp3");

export default function HunterScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const hunter = state.players.find(
    (p) => p.role === "hunter" && !p.isAlive
  );

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handleShoot = async (playerId: string) => {
    const { sound } = await Audio.Sound.createAsync(GUNFIRE_SFX, { volume: 1.0 });
    soundRef.current = sound;
    await sound.playAsync();
    dispatch({ type: "HUNTER_SHOOT", playerId });
  };

  useEffect(() => {
    if (state.phase === "day") router.replace("/day");
    else if (state.phase === "night") router.replace("/night");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  return (
    <>
      <Stack.Screen
        options={{ title: "Chasseur", headerBackVisible: false }}
      />
      <CardFrame title="Chasseur" subtitle={`${hunter?.name} a ete elimine`}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🏹</Text>
          <Text style={styles.title}>
            {hunter?.name} etait le Chasseur !
          </Text>
          <Text style={styles.subtitle}>
            Avant de mourir, il peut emporter quelqu'un avec lui.
          </Text>
        </View>

        <FlatList
          data={alivePlayers}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.playerOption}
              onPress={() => handleShoot(item.id)}
            >
              <Text style={styles.playerOptionText}>{item.name}</Text>
            </Pressable>
          )}
        />
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  playerOption: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerOptionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
