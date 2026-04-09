import { ImageSourcePropType } from "react-native";

export type Role =
  | "werewolf"
  | "villager"
  | "seer"
  | "witch"
  | "hunter"
  | "cupid"
  | "little_girl"
  | "savior"
  | "elder"
  | "raven"
  | "village_idiot";

export interface RoleDefinition {
  id: Role;
  label: string;
  emoji: string;
  camp: "village" | "werewolves";
  description: string;
  min: number;
  max: number;
  nightOrder: number | null;
  firstNightOnly: boolean;
  activeEveryOtherNight: boolean;
  cardImage?: ImageSourcePropType;
}

export const ROLE_REGISTRY: Record<Role, RoleDefinition> = {
  werewolf: {
    id: "werewolf",
    label: "Loup-Garou",
    emoji: "🐺",
    camp: "werewolves",
    description:
      "Chaque nuit, les Loups-Garous se réveillent ensemble et désignent une victime parmi les Villageois. Le jour, ils tentent de passer inaperçus pour éviter d'être éliminés par le vote du village.",
    min: 1,
    max: 4,
    nightOrder: 40,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/loup-garou-card.png"),
  },
  villager: {
    id: "villager",
    label: "Villageois",
    emoji: "🧑‍🌾",
    camp: "village",
    description:
      "Le Villageois n'a aucun pouvoir spécial, mais sa voix compte autant que celle des autres lors des votes du jour. Il doit user de son sens de l'observation et de sa persuasion pour identifier les Loups-Garous.",
    min: 0,
    max: Infinity,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  seer: {
    id: "seer",
    label: "Voyante",
    emoji: "🔮",
    camp: "village",
    description:
      "Chaque nuit, la Voyante peut découvrir la véritable identité d'un joueur de son choix. Elle doit partager ses informations avec sagesse pour guider le village sans se dévoiler aux Loups-Garous.",
    min: 0,
    max: 1,
    nightOrder: 20,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/voyante-card.png"),
  },
  witch: {
    id: "witch",
    label: "Sorcière",
    emoji: "🧪",
    camp: "village",
    description:
      "La Sorcière possède deux potions : une potion de vie pour sauver la victime des Loups-Garous, et une potion de mort pour éliminer n'importe quel joueur. Chaque potion ne peut être utilisée qu'une seule fois par partie.",
    min: 0,
    max: 1,
    nightOrder: 50,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/sorciere-card.png"),
  },
  hunter: {
    id: "hunter",
    label: "Chasseur",
    emoji: "🏹",
    camp: "village",
    description:
      "Lorsque le Chasseur est éliminé, qu'il soit tué par les Loups-Garous ou chassé par le village, il tire immédiatement sur le joueur de son choix, emportant une victime supplémentaire avec lui.",
    min: 0,
    max: 1,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/chasseur-card.png"),
  },
  cupid: {
    id: "cupid",
    label: "Cupidon",
    emoji: "💘",
    camp: "village",
    description:
      "La première nuit, Cupidon désigne deux joueurs qui tombent amoureux. Les Amoureux doivent tous les deux survivre pour gagner : si l'un meurt, l'autre meurt de chagrin. Si les deux Amoureux sont un Loup-Garou et un Villageois, ils forment une troisième faction.",
    min: 0,
    max: 1,
    nightOrder: 5,
    firstNightOnly: true,
    activeEveryOtherNight: false,
  },
  little_girl: {
    id: "little_girl",
    label: "Petite Fille",
    emoji: "👧",
    camp: "village",
    description:
      "La Petite Fille peut entrouvrir les yeux pendant le réveil des Loups-Garous pour tenter d'identifier les membres de la meute. Si elle est surprise à espionner par un Loup-Garou, elle est immédiatement éliminée à sa place.",
    min: 0,
    max: 1,
    nightOrder: 60,
    firstNightOnly: false,
    activeEveryOtherNight: true,
  },
  savior: {
    id: "savior",
    label: "Sauveur",
    emoji: "🛡️",
    camp: "village",
    description:
      "Chaque nuit, le Sauveur peut protéger un joueur de son choix contre les attaques des Loups-Garous. Il ne peut pas protéger deux fois de suite la même personne, et il ne peut pas se protéger lui-même.",
    min: 0,
    max: 1,
    nightOrder: 30,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  elder: {
    id: "elder",
    label: "Ancien",
    emoji: "👴",
    camp: "village",
    description:
      "L'Ancien peut survivre à une attaque des Loups-Garous grâce à sa résistance légendaire. Cependant, s'il est éliminé par le village lors d'un vote, tous les Villageois perdent leurs pouvoirs spéciaux.",
    min: 0,
    max: 1,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  raven: {
    id: "raven",
    label: "Corbeau",
    emoji: "🐦‍⬛",
    camp: "village",
    description:
      "Chaque nuit, le Corbeau désigne un joueur qui reçoit deux votes supplémentaires contre lui lors du vote du lendemain. Ce pouvoir permet d'orienter les soupçons du village vers un suspect ciblé.",
    min: 0,
    max: 1,
    nightOrder: 55,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  village_idiot: {
    id: "village_idiot",
    label: "Idiot du Village",
    emoji: "🤪",
    camp: "village",
    description:
      "Si l'Idiot du Village est désigné pour être éliminé lors d'un vote, sa véritable identité est révélée et il est gracié par le village. Il perd cependant son droit de vote pour le reste de la partie.",
    min: 0,
    max: 1,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
};
