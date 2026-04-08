import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import CardFrame from "../components/CardFrame";
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Joueurs" }} />
      <MuteButton />
      <CardFrame title="Joueurs" subtitle="Ajoutez les participants">
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
      </CardFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
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
