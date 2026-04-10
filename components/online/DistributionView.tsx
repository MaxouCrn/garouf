import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  role: string | null;
  description: string | null;
  onReady: () => void;
}

export default function DistributionView({ role, description, onReady }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ton role</Text>
      <Text style={styles.role}>{role ?? "..."}</Text>
      <Text style={styles.description}>{description ?? ""}</Text>
      <Pressable style={styles.button} onPress={onReady}>
        <Text style={styles.buttonText}>Compris</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.textSecondary, marginBottom: 16 },
  role: { fontSize: 36, fontWeight: "bold", color: colors.primary, marginBottom: 12 },
  description: { fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
});
