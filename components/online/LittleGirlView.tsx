import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";

interface Props {
  clueNames: string[];
  onDone: () => void;
  timerSeconds: number;
}

export default function LittleGirlView({ clueNames, onDone, timerSeconds }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu apercois des silhouettes...</Text>
      <ActionTimer seconds={timerSeconds} onExpire={onDone} />
      {clueNames.map((name, idx) => (
        <View key={idx} style={styles.clue}>
          <Text style={styles.clueName}>{name}</Text>
        </View>
      ))}
      <Pressable style={styles.button} onPress={onDone}>
        <Text style={styles.buttonText}>Refermer les yeux</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, color: colors.primary, marginBottom: 16, textAlign: "center" },
  clue: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8, width: "100%" },
  clueName: { fontSize: 18, color: colors.text, textAlign: "center" },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 24 },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
