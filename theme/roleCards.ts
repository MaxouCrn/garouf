import { ImageSourcePropType } from "react-native";
import type { Role } from "../game/roles";

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
  witch: { label: "Sorcière", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
  cupid: { label: "Cupidon", emoji: "💘" },
  little_girl: { label: "Petite Fille", emoji: "👧" },
  savior: { label: "Salvateur", emoji: "🛡️" },
  elder: { label: "Ancien", emoji: "👴" },
  raven: { label: "Corbeau", emoji: "🐦‍⬛" },
  village_idiot: { label: "Idiot du Village", emoji: "🤪" },
};
