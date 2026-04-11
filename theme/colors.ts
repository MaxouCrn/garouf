export const colors = {
  // Backgrounds
  background: "#0a0e16",
  surface: "rgba(126,184,218,0.04)",
  surfaceBorder: "rgba(126,184,218,0.1)",

  // Accent — bleu lunaire
  accent: "#7eb8da",
  accentBright: "#a8d8f0",
  accentDim: "rgba(126,184,218,0.25)",

  // Warm — ambre
  warm: "#e8a849",
  warmDim: "rgba(232,168,73,0.25)",

  // Text
  text: "#e4e8f0",
  textSecondary: "#8a94a8",
  textMuted: "#4a5268",

  // Semantic
  danger: "#e85d5d",
  success: "#5dd9a6",

  // Glass panels — for readable text over any background
  glass: "rgba(8,12,20,0.86)",
  glassBorder: "rgba(126,184,218,0.1)",

  // Utilities
  white: "#fff",
  black: "#000",
  overlay: "rgba(0,0,0,0.7)",

  // Legacy aliases — keep existing screens working during migration
  primary: "#7eb8da",
  primaryLight: "#a8d8f0",
  goldDark: "#e8a849",
  wolfBlue: "#3A5F8A",
  ember: "#e8a849",
  surfaceLight: "rgba(126,184,218,0.08)",
  warning: "#e8a849",
} as const;
