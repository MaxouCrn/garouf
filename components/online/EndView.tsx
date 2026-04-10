import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  winner: "werewolves" | "villagers" | "lovers" | null;
}

const WINNER_TEXT = {
  werewolves: "Les Loups-Garous ont devore le village !",
  villagers: "Le village a triomphe des loups !",
  lovers: "Les Amoureux ont survecu ensemble !",
};

export default function EndView({ winner }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fin de la partie</Text>
      <Text style={styles.result}>
        {winner ? WINNER_TEXT[winner] : "Match nul"}
      </Text>
      <Pressable style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Retour a l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 28, color: colors.primary, marginBottom: 24 },
  result: { fontSize: 20, color: colors.text, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
});
