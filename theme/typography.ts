import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  cinzelRegular: "Cinzel_400Regular",
  cinzelBold: "Cinzel_700Bold",
} as const;

export const typography: Record<string, TextStyle> = {
  // Cinzel Bold 28-32px, gold — screen titles, "GAROUF"
  heading: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
  },
  // Cinzel Regular 20-22px, light — phase names, subtitles
  subheading: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 20,
    color: colors.text,
  },
  // System 16px — body text (no fontFamily = system default)
  body: {
    fontSize: 16,
    color: colors.text,
  },
  // System 14px — secondary info
  bodySecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // System 12px — labels, hints
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
};
