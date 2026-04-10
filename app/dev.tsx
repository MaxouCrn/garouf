import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useGame, GameState } from "../context/GameContext";
import {
  DEV_PRESETS,
  PHASE_ROUTE_MAP,
  ONLINE_ROUTE_MAP,
} from "../game/devPresets";
import { colors } from "../theme/colors";

export default function DevScreen() {
  const router = useRouter();
  const { dispatch } = useGame();
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const loadPreset = (key: string) => {
    const preset = DEV_PRESETS[key];
    setJson(JSON.stringify(preset.state, null, 2));
    setError(null);
    setActivePreset(key);
  };

  const launch = () => {
    let parsed: GameState;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setError("JSON invalide: " + (e as Error).message);
      return;
    }

    if (!parsed.phase) {
      setError("Le state doit contenir un champ 'phase'");
      return;
    }

    dispatch({ type: "SET_STATE", payload: parsed });

    // Determine route
    let route: string | undefined;
    if (activePreset && ONLINE_ROUTE_MAP[activePreset]) {
      route = ONLINE_ROUTE_MAP[activePreset];
    } else {
      route = PHASE_ROUTE_MAP[parsed.phase];
    }

    if (!route) {
      setError("Phase inconnue: " + parsed.phase);
      return;
    }

    router.replace(route as any);
  };

  const localPresets = Object.entries(DEV_PRESETS).filter(
    ([key]) => !key.startsWith("online_")
  );
  const onlinePresets = Object.entries(DEV_PRESETS).filter(([key]) =>
    key.startsWith("online_")
  );

  const isValid = (() => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dev Tools</Text>
      <Text style={styles.sectionTitle}>Local</Text>
      <View style={styles.presetRow}>
        {localPresets.map(([key, { label }]) => (
          <Pressable
            key={key}
            style={[
              styles.presetButton,
              activePreset === key && styles.presetButtonActive,
            ]}
            onPress={() => loadPreset(key)}
          >
            <Text
              style={[
                styles.presetText,
                activePreset === key && styles.presetTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Online</Text>
      <View style={styles.presetRow}>
        {onlinePresets.map(([key, { label }]) => (
          <Pressable
            key={key}
            style={[
              styles.presetButton,
              activePreset === key && styles.presetButtonActive,
            ]}
            onPress={() => loadPreset(key)}
          >
            <Text
              style={[
                styles.presetText,
                activePreset === key && styles.presetTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>State JSON</Text>
      <TextInput
        style={styles.editor}
        value={json}
        onChangeText={(text) => {
          setJson(text);
          setError(null);
          setActivePreset(null);
        }}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.launchButton, !isValid && styles.launchButtonDisabled]}
        onPress={launch}
        disabled={!isValid}
      >
        <Text style={styles.launchText}>Lancer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
  },
  presetText: {
    color: colors.primary,
    fontSize: 14,
  },
  presetTextActive: {
    color: colors.black,
  },
  editor: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 12,
    borderRadius: 8,
    padding: 12,
    minHeight: 300,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  error: {
    color: colors.danger,
    marginTop: 8,
    fontSize: 14,
  },
  launchButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 40,
  },
  launchButtonDisabled: {
    opacity: 0.4,
  },
  launchText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
