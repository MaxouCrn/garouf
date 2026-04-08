# Loup-Garou Mobile App — Design Spec

## Contexte

Application mobile pour jouer au Loup-Garou entre collegues pendant la pause du midi. Un seul telephone sert de maitre du jeu numerique, les joueurs se le passent pour voir leur role et le maitre du jeu l'utilise pour orchestrer les phases.

## Stack technique

- **Framework :** React Native + Expo (managed workflow)
- **Langage :** TypeScript
- **Navigation :** expo-router (file-based routing)
- **Gestion d'etat :** React Context + useReducer
- **Style :** StyleSheet natif, theme sombre
- **Backend :** Aucun. Tout est local, en memoire.
- **Distribution :** Expo Go (scan QR code) ou build de dev (APK/IPA)

## Flux de l'application

1. **Ecran d'accueil** — Bouton "Nouvelle partie"
2. **Configuration des joueurs** — Ajout des noms un par un (champ texte + bouton "Ajouter"), liste visible avec suppression possible, bouton "Suivant" quand assez de joueurs
3. **Selection des roles + timer** — Choix des roles presents dans la partie. Verification que le nombre de cartes = nombre de joueurs. Reglage du timer de debat (1, 2, 3, 4 ou 5 minutes, defaut : 5 min)
4. **Distribution des roles** — Chaque joueur prend le telephone a tour de role. Ecran "C'est au tour de [Nom], appuie pour voir ton role" → affichage du role → appui pour cacher → joueur suivant. Les roles sont assignes aleatoirement.
5. **Boucle nuit/jour** — L'app guide les phases et enregistre les actions
6. **Fin de partie** — Affichage du camp gagnant et recap de tous les roles

## Roles disponibles (prototype)

| Role | Quantite | Pouvoir |
|------|----------|---------|
| Loup-Garou | 2-3 | Se reveille la nuit, vote pour eliminer un villageois |
| Villageois | N (remplit les places restantes) | Aucun pouvoir special |
| Voyante | 0-1 | Se reveille la nuit, peut voir le role d'un joueur |
| Sorciere | 0-1 | Potion de vie + potion de mort (une seule utilisation chacune) |
| Chasseur | 0-1 | Quand il meurt, il emporte un joueur avec lui |

## Structure des donnees

```typescript
interface Player {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
}

type Role = "werewolf" | "villager" | "seer" | "witch" | "hunter";

type GamePhase =
  | "setup_players"
  | "setup_roles"
  | "distribution"
  | "night"
  | "day"
  | "end";

interface NightActions {
  werewolvesTarget: string | null;   // playerId
  seerTarget: string | null;         // playerId
  witchHeal: boolean;
  witchKill: string | null;          // playerId
}

interface GameState {
  players: Player[];
  phase: GamePhase;
  turn: number;
  nightActions: NightActions;
  witchPotions: { life: boolean; death: boolean };
  winner: "werewolves" | "villagers" | null;
  debateTimerMinutes: number;        // 1-5, defaut 5
}
```

## Deroulement d'une nuit

L'app affiche un ecran par etape. Chaque etape est sautee si le role est absent de la partie ou si le joueur est mort.

1. **"Tout le monde ferme les yeux"** — Ecran d'introduction de nuit
2. **"Les Loups-Garous se reveillent"** — Liste des joueurs vivants (hors loups), selection de la victime, confirmation
3. **"La Voyante se reveille"** — Selection d'un joueur, revelation de son role
4. **"La Sorciere se reveille"** — Affichage de la victime des loups. Option de sauver (si potion de vie dispo). Option d'empoisonner quelqu'un d'autre (si potion de mort dispo).
5. **"Tout le monde se reveille"** — Resolution : annonce des morts. Si le chasseur meurt, ecran special pour choisir sa cible.

**Ordre de resolution :** Loups-Garous → Sorciere (soin) → Sorciere (poison) → Resultat

## Deroulement d'un jour

1. **"Le village se reveille"** — Annonce de qui est mort cette nuit (ou "personne n'est mort")
2. **"Debat"** — Timer configurable (1-5 min) avec compte a rebours visible. Passage automatique au vote quand le timer arrive a zero.
3. **"Vote"** — Le maitre du jeu selectionne le joueur elimine (le vote se fait a main levee IRL). Si c'est le chasseur, ecran special pour choisir sa cible.
4. **Verification de fin de partie** — Check des conditions de victoire. Si la partie continue, retour a la nuit.

## Conditions de victoire

- **Villageois gagnent :** Plus aucun loup-garou vivant
- **Loups-Garous gagnent :** Nombre de loups >= nombre de villageois vivants

## Ecrans

| Ecran | Description |
|-------|-------------|
| `HomeScreen` | Accueil, bouton "Nouvelle partie" |
| `PlayersSetupScreen` | Ajout des joueurs un par un |
| `RolesSetupScreen` | Selection des roles + reglage du timer de debat |
| `DistributionScreen` | Distribution des roles joueur par joueur |
| `NightScreen` | Phases de nuit (loups, voyante, sorciere) |
| `DayScreen` | Annonce des morts, timer de debat, vote |
| `HunterScreen` | Ecran special quand le chasseur meurt |
| `EndScreen` | Resultat final + recap des roles |

## Librairies externes

- `expo` (SDK de base)
- `expo-router` (navigation)

Aucune autre dependance pour le prototype.

## Evolutions futures (hors scope prototype)

- **Narration automatique :** Text-to-speech via `expo-speech` pour que tout le monde puisse jouer sans narrateur
- **Roles supplementaires :** Cupidon, Voleur, Petite fille, Ancien, Salvateur...
- **Publication sur les stores :** App Store et Google Play
