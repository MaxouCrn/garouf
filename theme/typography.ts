import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  // Playfair Display — titles, headings
  displayBold: "PlayfairDisplay_700Bold",
  displayRegular: "PlayfairDisplay_400Regular",

  // Outfit — body text, UI elements
  bodyRegular: "Outfit_400Regular",
  bodyMedium: "Outfit_500Medium",
  bodySemiBold: "Outfit_600SemiBold",
  bodyBold: "Outfit_700Bold",

  // Legacy — keep Cinzel for role cards and existing screens during migration
  cinzelRegular: "Cinzel_400Regular",
  cinzelBold: "Cinzel_700Bold",
} as const;

export const typography: Record<string, TextStyle> = {
  heading: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
  },
  subheading: {
    fontFamily: fonts.displayRegular,
    fontSize: 20,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.text,
  },
  bodySecondary: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 48,
    color: colors.text,
  },
};
