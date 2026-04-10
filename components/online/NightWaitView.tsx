import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NightStep } from "../../game/nightEngine";

const STEP_LABELS: Record<string, string> = {
  intro: "La nuit tombe sur le village...",
  cupid: "Cupidon ouvre les yeux...",
  lovers_reveal: "Les amoureux se decouvrent...",
  seer: "La Voyante ouvre les yeux...",
  savior: "Le Salvateur ouvre les yeux...",
  werewolves: "Les Loups-Garous ouvrent les yeux...",
  witch: "La Sorciere ouvre les yeux...",
  raven: "Le Corbeau ouvre les yeux...",
  little_girl: "La Petite Fille entrouvre les yeux...",
  resolution: "Le soleil se leve...",
};

interface Props {
  step: NightStep | null;
}

export default function NightWaitView({ step }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{step ? STEP_LABELS[step] || step : "..."}</Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  text: { fontFamily: fonts.cinzelBold, fontSize: 22, color: colors.primary, textAlign: "center" },
});
