import { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { radii, spacing } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import GButton from "../GButton";
import GlassRow from "../GlassRow";
import type { NightActionRequiredPayload } from "../../types/online";

interface Props {
  action: NightActionRequiredPayload;
  onSubmit: (actionType: string, payload: Record<string, unknown>) => void;
}

export default function NightActionView({ action, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    const actionMap: Record<string, string> = {
      seer: "seer_inspect",
      savior: "savior_protect",
      raven: "raven_mark",
    };
    const actionType = actionMap[action.step] || action.step;
    onSubmit(actionType, { targetId: selected });
  };

  const handleTimeout = () => {
    const actionMap: Record<string, string> = {
      seer: "seer_inspect",
      savior: "savior_protect",
      raven: "raven_mark",
    };
    const actionType = actionMap[action.step] || action.step;
    onSubmit(actionType, { targetId: null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{action.instruction}</Text>
      <ActionTimer seconds={action.timerSeconds} onExpire={handleTimeout} />
      <FlatList
        data={action.targets}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected === item.id;
          return (
            <GlassRow
              selected={isSelected}
              selectedColor={colors.accent}
              onPress={() => setSelected(item.id)}
            >
              <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.playerName, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
            </GlassRow>
          );
        }}
      />
      <GButton
        variant="primary"
        onPress={handleConfirm}
        disabled={!selected}
      >
        Confirmer
      </GButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  instruction: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  list: { flex: 1, marginTop: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: {
    backgroundColor: "rgba(126,184,218,0.15)",
    borderColor: colors.accent,
  },
  avatarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.accent,
  },
  avatarTextSelected: {
    color: colors.white,
  },
  playerName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.text,
  },
  selectedText: {
    color: colors.white,
  },
});
