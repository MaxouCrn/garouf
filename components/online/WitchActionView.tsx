import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import ActionTimer from "./ActionTimer";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function WitchActionView({ action, onSubmit }: Props) {
  const [heal, setHeal] = useState(false);
  const [killTargetId, setKillTargetId] = useState<string | null>(null);
  const [showDeathPotion, setShowDeathPotion] = useState(false);

  const werewolfTarget = action.werewolfTarget ?? null;
  const lifeAvailable = action.potions?.life ?? false;
  const deathAvailable = action.potions?.death ?? false;

  const handleSubmit = (healOverride?: boolean, killOverride?: string | null) => {
    onSubmit("witch_action", {
      heal: healOverride !== undefined ? healOverride : heal,
      killTargetId: killOverride !== undefined ? killOverride : killTargetId,
    });
  };

  const handleTimeout = () => {
    onSubmit("witch_action", { heal: false, killTargetId: null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>La Sorciere</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />

      {/* Wolf attack info */}
      {werewolfTarget ? (
        <Text style={styles.attackInfo}>
          Les loups ont attaque {werewolfTarget.name} !
        </Text>
      ) : (
        <Text style={styles.noAttackInfo}>Les loups n'ont attaque personne.</Text>
      )}

      {/* Potion status */}
      <View style={styles.potionStatus}>
        <Text style={[styles.potionLabel, !lifeAvailable && styles.potionUsed]}>
          Potion de vie : {lifeAvailable ? "disponible" : "utilisee"}
        </Text>
        <Text style={[styles.potionLabel, !deathAvailable && styles.potionUsed]}>
          Potion de mort : {deathAvailable ? "disponible" : "utilisee"}
        </Text>
      </View>

      {/* Life potion option */}
      {lifeAvailable && werewolfTarget && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utiliser la potion de vie ?</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.optionButton, heal && styles.optionSelected]}
              onPress={() => setHeal(true)}
            >
              <Text style={[styles.optionText, heal && styles.optionTextSelected]}>Oui</Text>
            </Pressable>
            <Pressable
              style={[styles.optionButton, !heal && styles.optionSelected]}
              onPress={() => setHeal(false)}
            >
              <Text style={[styles.optionText, !heal && styles.optionTextSelected]}>Non</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Death potion option */}
      {deathAvailable && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utiliser la potion de mort ?</Text>
          {!showDeathPotion ? (
            <Pressable style={styles.optionButton} onPress={() => setShowDeathPotion(true)}>
              <Text style={styles.optionText}>Choisir une cible</Text>
            </Pressable>
          ) : (
            <FlatList
              data={action.targets}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.playerRow, killTargetId === item.id && styles.playerRowSelected]}
                  onPress={() => setKillTargetId(killTargetId === item.id ? null : item.id)}
                >
                  <Text style={[styles.playerName, killTargetId === item.id && styles.playerNameSelected]}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {/* Pass button */}
      <Pressable style={styles.passButton} onPress={() => handleSubmit(false, null)}>
        <Text style={styles.passButtonText}>Passer</Text>
      </Pressable>

      {/* Confirm button (only if choices made) */}
      {(heal || killTargetId) && (
        <Pressable style={styles.confirmButton} onPress={() => handleSubmit()}>
          <Text style={styles.confirmButtonText}>Confirmer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: colors.primary, textAlign: "center", marginBottom: 8 },
  attackInfo: { fontSize: 18, color: colors.danger, textAlign: "center", marginVertical: 12 },
  noAttackInfo: { fontSize: 16, color: colors.textSecondary, textAlign: "center", marginVertical: 12 },
  potionStatus: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  potionLabel: { fontSize: 13, color: colors.success },
  potionUsed: { color: colors.textMuted },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, color: colors.text, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
  optionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  optionSelected: { backgroundColor: colors.primary },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { color: colors.black, fontWeight: "bold" },
  list: { maxHeight: 200 },
  playerRow: { backgroundColor: colors.surface, padding: 14, borderRadius: 8, marginBottom: 6 },
  playerRowSelected: { backgroundColor: colors.danger },
  playerName: { fontSize: 15, color: colors.text },
  playerNameSelected: { color: colors.white, fontWeight: "bold" },
  passButton: {
    backgroundColor: colors.surfaceLight,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  passButtonText: { color: colors.textSecondary, fontSize: 16 },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
});
