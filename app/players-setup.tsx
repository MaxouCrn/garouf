import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ImageBackground,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import MuteButton from "../components/MuteButton";

const MIN_PLAYERS = 4;

export default function PlayersSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [name, setName] = useState("");

  const addPlayer = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    dispatch({ type: "ADD_PLAYER", name: trimmed });
    setName("");
  };

  const canProceed = state.players.length >= MIN_PLAYERS;

  return (
    <>
      <Stack.Screen options={{ title: "Joueurs", headerShown: false }} />
      <ImageBackground
        source={require("../assets/inscription-joueur-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <MuteButton />

          <Text style={styles.title}>Joueurs</Text>
          <Text style={styles.subtitle}>Ajoutez les participants</Text>

          <View style={styles.content}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Nom du joueur"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                onSubmitEditing={addPlayer}
                autoFocus
              />
              <Pressable
                style={[styles.addButton, !name.trim() && styles.buttonDisabled]}
                onPress={addPlayer}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.count}>
              {state.players.length} joueur{state.players.length !== 1 ? "s" : ""}{" "}
              {state.players.length < MIN_PLAYERS
                ? `(min. ${MIN_PLAYERS})`
                : ""}
            </Text>

            <FlatList
              data={state.players}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item, index }) => (
                <View style={styles.playerRow}>
                  <Text style={styles.playerName}>
                    {index + 1}. {item.name}
                  </Text>
                  <Pressable
                    onPress={() =>
                      dispatch({ type: "REMOVE_PLAYER", id: item.id })
                    }
                  >
                    <Text style={styles.removeButton}>✕</Text>
                  </Pressable>
                </View>
              )}
            />

            <Pressable
              style={[styles.nextButton, !canProceed && styles.buttonDisabled]}
              onPress={() => router.push("/roles-setup")}
              disabled={!canProceed}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.white,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.white,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(22,33,62,0.85)",
    color: colors.text,
    fontSize: 18,
    padding: 14,
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  addButtonText: {
    color: colors.black,
    fontSize: 28,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  count: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(22,33,62,0.85)",
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  removeButton: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: 8,
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  nextButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
