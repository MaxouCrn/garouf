import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  nightDeaths: { id: string; name: string }[];
  isHost: boolean;
  myPlayerId: string;
  onContinue: () => void;
}

export default function DayAnnouncementView({ nightDeaths, isHost, myPlayerId, onContinue }: Props) {
  const isMyDeath = nightDeaths.some((d) => d.id === myPlayerId);

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
      {isMyDeath && (
        <Text style={styles.eliminated}>Vous avez ete elimine cette nuit...</Text>
      )}
      {isHost ? (
        <Pressable style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Passer au debat</Text>
        </Pressable>
      ) : (
        <Text style={styles.waiting}>En attente du lancement du debat...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  message: { fontSize: 18, color: colors.success, marginBottom: 16 },
  death: { fontSize: 18, color: colors.danger, marginBottom: 8 },
  eliminated: { fontSize: 18, color: colors.warning, marginTop: 16, textAlign: "center" },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
  waiting: { fontSize: 16, color: colors.textSecondary, marginTop: 32, textAlign: "center" },
});
