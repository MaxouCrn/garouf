import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

interface GInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
}

export default function GInput({ label, error, ...inputProps }: GInputProps) {
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, hasError && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {hasError && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: 14,
    fontSize: 16,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  inputError: {
    borderColor: "rgba(232,93,93,0.5)",
  },
  error: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
