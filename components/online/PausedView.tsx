import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import type { GamePausedPayload } from "../../types/online";

interface Props {
  info: GamePausedPayload;
}

export default function PausedView({ info }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partie en pause</Text>
      <Text style={styles.reason}>{info.disconnectedPlayer} a perdu la connexion</Text>
      <Text style={styles.timer}>Reprise dans {info.resumeIn}s...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: colors.warning, marginBottom: 16 },
  reason: { fontSize: 18, color: colors.text, marginBottom: 12 },
  timer: { fontSize: 24, color: colors.primary },
});
