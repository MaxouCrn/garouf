import { ImageSourcePropType } from "react-native";
import type { Role } from "../context/GameContext";

export const ROLE_CARDS: Partial<Record<Role, ImageSourcePropType>> = {
  werewolf: require("../assets/cards/loup-garou-card.png"),
  seer: require("../assets/cards/voyante-card.png"),
  witch: require("../assets/cards/sorciere-card.png"),
  hunter: require("../assets/cards/chasseur-card.png"),
};

export const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};
