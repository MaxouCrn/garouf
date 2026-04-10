import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  nightDeaths: { id: string; name: string }[];
  onContinue: () => void;
}

export default function DayAnnouncementView({ nightDeaths, onContinue }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le village se reveille...</Text>
      {nightDeaths.length === 0 ? (
        <Text style={styles.message}>Personne n'est mort cette nuit !</Text>
      ) : (
        nightDeaths.map((d) => (
          <Text key={d.id} style={styles.death}>{d.name} a ete elimine(e)</Text>
        ))
      )}
      <Pressable style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Debat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  message: { fontSize: 18, color: colors.success, marginBottom: 16 },
  death: { fontSize: 18, color: colors.danger, marginBottom: 8 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
});
