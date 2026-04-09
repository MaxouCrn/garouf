# Design Spec — Nouveaux rôles, ordre de nuit dynamique et paramétrage de partie

> Date : 2026-04-09
> Branche : feature/parameter-game
> Référence règles : [docs/GAME_RULES.md](../../GAME_RULES.md)

---

## Objectif

Faire évoluer l'application Garouf en ajoutant 6 nouveaux rôles du Loup-Garou de Thiercelieux, un ordre de nuit dynamique basé sur les rôles en jeu, un système de paramétrage de partie avec presets et équilibrage, ainsi qu'un écran Grimoire pour consulter les rôles.

---

## Périmètre

### Inclus

- 6 nouveaux rôles : Cupidon, Petite Fille, Salvateur, Ancien, Corbeau, Idiot du Village
- Ordre de nuit dynamique selon les rôles présents et vivants
- Paramétrage hybride : presets recommandés + personnalisation libre + warnings
- Écran Grimoire (livre des rôles) sur la page d'accueil
- Condition de victoire "Couple mixte" (Amoureux)
- Interactions entre rôles (Salvateur/Loups, Ancien/Village, Amoureux cascade, etc.)

### Exclus (futures itérations)

- Voleur (mécanique des 2 cartes au centre trop complexe pour cette itération)
- Capitaine (mécanique de jour séparée : élection, vote double, succession)
- Loup Blanc, Chien-Loup, Renard, Bouc Émissaire, Montreur d'Ours, Chevalier

---

## Architecture

### Approche hybride pragmatique

Le reducer `GameContext.tsx` reste le point d'entrée centralisé mais délègue la logique métier à des modules dédiés dans un nouveau dossier `game/`.

### Nouveaux fichiers

```
game/
├── roles.ts          — Registre des rôles (metadata, config, limites)
├── nightEngine.ts    — Ordre de nuit dynamique
├── balance.ts        — Presets par nombre de joueurs + warnings
└── resolution.ts     — Résolution des morts avec interactions

app/
└── grimoire.tsx      — Nouvel écran Grimoire
```

### Fichiers modifiés

| Fichier | Changements |
|---------|-------------|
| `context/GameContext.tsx` | Nouveaux types, nouveaux champs state, reducer délègue à `game/resolution.ts` |
| `app/index.tsx` | Ajout bouton "Grimoire" sous "Commencer une partie" |
| `app/roles-setup.tsx` | Refonte : presets auto + personnalisation libre + warnings, 6 nouveaux rôles |
| `app/night.tsx` | Nouveaux steps (Cupidon, Amoureux, Salvateur, Corbeau, Petite Fille) |
| `app/day.tsx` | Gestion Corbeau (+2 voix), Idiot du Village (survie), Ancien (perte pouvoirs), cascade Amoureux |
| `app/distribution.tsx` | Nouvelles cartes à afficher |
| `app/end.tsx` | Nouveau cas de victoire "lovers" |
| `theme/roleCards.ts` | Ajout des 6 nouveaux rôles (images/emojis, labels) |
| `hooks/useNarrator.ts` | Nouveaux sons narrateur pour les nouveaux steps |

---

## Modèle de données

### Type `Role` étendu

```typescript
type Role =
  | "werewolf" | "villager" | "seer" | "witch" | "hunter"
  | "cupid" | "little_girl" | "savior" | "elder" | "raven" | "village_idiot";
```

### Nouveaux champs dans `GameState`

```typescript
interface GameState {
  // ... champs existants inchangés ...

  // Cupidon
  lovers: [string, string] | null;        // IDs des 2 amoureux

  // Salvateur
  saviorTarget: string | null;            // protégé cette nuit
  lastSaviorTarget: string | null;        // protégé la nuit précédente (interdit 2x de suite)

  // Ancien
  elderLives: number;                     // 2 par défaut, perd 1 à chaque attaque de loup

  // Corbeau
  ravenTarget: string | null;             // joueur marqué (+2 voix)

  // Petite Fille
  littleGirlClue: string[] | null;        // IDs des 2-3 joueurs montrés (dont 1 loup)
  littleGirlActiveNight: boolean;         // true les nuits impaires

  // Idiot du Village
  villageIdiotRevealed: boolean;          // a déjà survécu à un vote

  // Première nuit
  isFirstNight: boolean;
}
```

### Type `NightStep` étendu

```typescript
type NightStep =
  | "intro"
  | "cupid"            // 1ère nuit : désigner les amoureux
  | "lovers_reveal"    // 1ère nuit : les amoureux se découvrent
  | "seer"
  | "savior"
  | "werewolves"
  | "witch"
  | "raven"
  | "little_girl"      // résultat de l'espionnage (nuits impaires)
  | "resolution";
```

### Nouvelles actions du reducer

```typescript
type GameAction =
  // ... actions existantes ...
  | { type: "SET_LOVERS"; player1Id: string; player2Id: string }
  | { type: "SET_SAVIOR_TARGET"; playerId: string }
  | { type: "SET_RAVEN_TARGET"; playerId: string | null }
  | { type: "SET_LITTLE_GIRL_CLUE"; clue: string[] }
```

---

## Module `game/roles.ts` — Registre des rôles

```typescript
interface RoleDefinition {
  id: Role;
  label: string;
  emoji: string;
  camp: "village" | "werewolves";
  description: string;
  min: number;
  max: number;
  nightOrder: number | null;     // position dans l'ordre de nuit (null = passif)
  firstNightOnly: boolean;       // true pour Cupidon
  activeEveryOtherNight: boolean; // true pour Petite Fille
  cardImage?: ImageSourcePropType; // image de la carte si disponible
}

const ROLE_REGISTRY: Record<Role, RoleDefinition>;
```

Le registre est la source unique de vérité. Il alimente : le Grimoire, le setup des rôles, l'ordre de nuit, l'équilibrage, la distribution.

### Rôles avec image de carte disponible

- `werewolf` → `assets/cards/loup-garou-card.png`
- `seer` → `assets/cards/voyante-card.png`
- `witch` → `assets/cards/sorciere-card.png`
- `hunter` → `assets/cards/chasseur-card.png`

### Rôles sans image (emoji en placeholder)

- `villager` 🧑‍🌾, `cupid` 💘, `little_girl` 👧, `savior` 🛡️, `elder` 👴, `raven` 🐦‍⬛, `village_idiot` 🤪

---

## Module `game/nightEngine.ts` — Ordre de nuit dynamique

```typescript
function buildNightSteps(
  players: Player[],
  isFirstNight: boolean,
  currentTurn: number
): NightStep[]
```

### Première nuit

| Ordre | Step | Condition |
|-------|------|-----------|
| 1 | `intro` | Toujours |
| 2 | `cupid` | Cupidon en jeu |
| 3 | `lovers_reveal` | Cupidon en jeu |
| 4 | `seer` | Voyante vivante |
| 5 | `savior` | Salvateur vivant |
| 6 | `werewolves` | Toujours |
| 7 | `witch` | Sorcière vivante |
| 8 | `raven` | Corbeau vivant |
| 9 | `resolution` | Toujours |

### Nuits suivantes

| Ordre | Step | Condition |
|-------|------|-----------|
| 1 | `intro` | Toujours |
| 2 | `seer` | Voyante vivante |
| 3 | `savior` | Salvateur vivant |
| 4 | `werewolves` | Toujours |
| 5 | `witch` | Sorcière vivante |
| 6 | `raven` | Corbeau vivant |
| 7 | `little_girl` | Petite Fille vivante ET tour impair |
| 8 | `resolution` | Toujours |

Si l'Ancien a été tué par le village (`elderKilledByVillage = true`), les steps `seer`, `savior`, `witch`, `raven`, `little_girl` sont supprimés (pouvoirs perdus).

---

## Module `game/balance.ts` — Presets et équilibrage

### Presets recommandés

| Joueurs | Loups | Voyante | Sorcière | Chasseur | Cupidon | Petite Fille | Salvateur | Ancien | Corbeau | Idiot | Villageois |
|---------|-------|---------|----------|----------|---------|--------------|-----------|--------|---------|-------|------------|
| **6** | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **7** | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **8** | 2 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **9** | 2 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 3 |
| **10** | 3 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 3 |
| **11** | 3 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 3 |
| **12** | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 3 |
| **13** | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 3 |
| **14** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 2 |
| **15** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 2 |
| **16** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |
| **17** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 3 |
| **18** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 4 |

### Warnings d'équilibrage

```typescript
function getBalanceWarnings(
  playerCount: number,
  composition: Record<Role, number>
): string[]
```

Warnings possibles :
- "Trop de Loups-Garous pour {n} joueurs (recommandé : {x})"
- "Pas assez de Villageois simples — les rôles sont trop devinables"
- "Le Cupidon est plus intéressant à partir de 9 joueurs"
- "Aucune Voyante ni Sorcière — le village manque d'information"
- "Le ratio Loups/Villageois semble déséquilibré"

Les warnings sont **non-bloquants** : affichés en orange, le joueur peut ignorer et continuer.

### Limites par rôle

| Rôle | Min | Max |
|------|-----|-----|
| Loup-Garou | 1 | 4 |
| Villageois | 0 | ∞ (auto-calculé) |
| Voyante | 0 | 1 |
| Sorcière | 0 | 1 |
| Chasseur | 0 | 1 |
| Cupidon | 0 | 1 |
| Petite Fille | 0 | 1 |
| Salvateur | 0 | 1 |
| Ancien | 0 | 1 |
| Corbeau | 0 | 1 |
| Idiot du Village | 0 | 1 |

---

## Module `game/resolution.ts` — Résolution des morts

### Résolution de nuit

```typescript
interface NightResolution {
  deaths: string[];
  savedByWitch: boolean;
  savedBySavior: boolean;
  elderLostLife: boolean;
  hunterTriggered: boolean;
  loversCascade: string | null;
  elderKilledByVillage: boolean;
}

function resolveNight(state: GameState): NightResolution
```

Ordre de résolution :
1. Cible des Loups identifiée
2. Protection du Salvateur appliquée (annule l'attaque si même cible)
3. Ancien : si ciblé et `elderLives > 1` → perd 1 vie, survit
4. Sorcière guérison appliquée (si pas déjà sauvé par Salvateur)
5. Sorcière poison appliquée (indépendant, pas bloqué par Salvateur)
6. Cascade Amoureux : si un mort a un amoureux → l'amoureux meurt aussi
7. Chasseur : si parmi les morts → déclenche le tir

### Résolution de vote

```typescript
function resolveVote(state: GameState, votedPlayerId: string): {
  deaths: string[];
  villageIdiotSurvived: boolean;
  hunterTriggered: boolean;
  loversCascade: string | null;
  elderKilledByVillage: boolean;
}
```

Ordre de résolution :
1. Vérifier si c'est l'Idiot du Village (non révélé) → survie, perd le droit de vote
2. Si non → le joueur meurt
3. Vérifier si c'est l'Ancien → `elderKilledByVillage = true`, tous les pouvoirs du village sont perdus
4. Cascade Amoureux
5. Chasseur parmi les morts → tir
6. Cascade Amoureux du tir du Chasseur
7. Vérification de victoire

---

## Écrans de nuit — Nouveaux steps

### Step `cupid` (première nuit)

- Texte : "Cupidon, ouvre les yeux. Désigne 2 joueurs qui seront liés par l'amour."
- Affiche tous les joueurs vivants
- Sélection de exactement 2 joueurs (peut se sélectionner lui-même)
- Validation : 2 joueurs sélectionnés
- Action : `SET_LOVERS`

### Step `lovers_reveal` (première nuit)

- Texte : "Les Amoureux, ouvrez les yeux et découvrez-vous."
- Affiche les noms des 2 amoureux
- Si couple mixte (Loup + Villageois) : message "Votre amour est interdit... Vous devez être les derniers survivants pour gagner."
- Pas d'action, bouton "Compris"

### Step `savior` (chaque nuit)

- Texte : "Le Salvateur, ouvre les yeux. Désigne un joueur à protéger cette nuit."
- Affiche les joueurs vivants
- Le joueur protégé la nuit précédente est grisé/désactivé
- Peut se sélectionner lui-même
- Action : `SET_SAVIOR_TARGET`

### Step `raven` (chaque nuit)

- Texte : "Le Corbeau, ouvre les yeux. Désigne un joueur qui portera ta marque."
- Affiche les joueurs vivants
- Bouton "Passer" disponible (peut ne marquer personne)
- Action : `SET_RAVEN_TARGET`

### Step `little_girl` (nuits impaires)

- Texte : "La Petite Fille entrouvre les yeux..."
- Pas d'interaction — écran de résultat
- Affiche 2-3 noms : "Tu aperçois des silhouettes dans la nuit..." suivi des noms
- Parmi ces noms, 1 est Loup-Garou (garanti), les autres sont des villageois aléatoires
- Bouton "Refermer les yeux"

### Génération de l'indice Petite Fille

```typescript
function generateLittleGirlClue(players: Player[]): string[] {
  const aliveWolves = players.filter(p => p.isAlive && p.role === "werewolf");
  const aliveNonWolves = players.filter(
    p => p.isAlive && p.role !== "werewolf" && p.role !== "little_girl"
  );
  const wolf = pickRandom(aliveWolves, 1);
  const decoys = pickRandom(aliveNonWolves, randomInt(1, 2));
  return shuffle([...wolf, ...decoys]);
}
```

---

## Modifications de la phase de jour

### Annonce des morts

- Mort d'un Amoureux la nuit → annoncer aussi : "[Nom] est mort(e) de chagrin."
- Ancien a perdu une vie mais survit → "L'Ancien a été attaqué mais résiste !"
- Rappel si pouvoirs perdus → "Les pouvoirs spéciaux du village sont perdus."

### Marque du Corbeau

- Avant le débat : "Un joueur porte la marque du Corbeau : [Nom]. Il commence avec 2 voix contre lui."
- Dans l'écran de vote, le compteur du joueur marqué démarre à 2
- Le Corbeau n'est pas révélé

### Idiot du Village au vote

- Première fois voté : "[Nom] est l'Idiot du Village ! Il survit mais perd son droit de vote."
- `villageIdiotRevealed = true`
- Reste vivant mais grisé lors des prochains votes
- Si déjà révélé : meurt normalement

### Ancien tué par le village

- Écran : "Vous avez éliminé l'Ancien ! Le village perd tous ses pouvoirs spéciaux."
- `elderKilledByVillage = true`
- Voyante, Sorcière, Chasseur, Salvateur, Corbeau, Petite Fille perdent leurs pouvoirs
- Les steps de nuit correspondants sont supprimés, le Chasseur ne tire plus

---

## Écran Grimoire (`app/grimoire.tsx`)

### Accès

Bouton sur la page d'accueil (`app/index.tsx`), sous "Commencer une partie".

### Layout

- Écran scrollable
- Titre : "Grimoire des Rôles" (Cinzel Bold, couleur or)
- Rôles groupés par camp avec séparateur :
  1. Camp du Village (bordure dorée)
  2. Camp des Loups-Garous (bordure rouge)

### Carte de rôle

Chaque rôle est affiché dans un `CardFrame` :
- **Si image disponible** dans `assets/cards/` : image de la carte à gauche + infos à droite
- **Si pas d'image** : emoji en grand dans un cadre stylisé à gauche + infos à droite
- Infos : nom (Cinzel Bold), badge camp (vert Village / rouge Loups), badge intervention (Nuit / Jour / Passif / 1ère nuit), description du pouvoir (2-3 phrases)

### Source de données

Lit directement depuis `ROLE_REGISTRY` dans `game/roles.ts` — pas de duplication.

---

## Conditions de victoire

### Trois conditions

| Camp | Condition |
|------|-----------|
| Village | Tous les Loups-Garous sont éliminés |
| Loups-Garous | Nombre de Loups vivants ≥ nombre de non-Loups vivants |
| Couple mixte | Les 2 Amoureux (Loup + Villageois) sont les seuls survivants |

### `checkWinner` modifié

```typescript
function checkWinner(
  players: Player[],
  lovers: [string, string] | null
): "villagers" | "werewolves" | "lovers" | null
```

Ordre de vérification :
1. Couple mixte : si amoureux Loup+Villageois et seuls 2 survivants → `"lovers"`
2. Village : si 0 Loup vivant → `"villagers"`
3. Loups : si Loups vivants ≥ non-Loups vivants → `"werewolves"`
4. Sinon → `null`

### Écran de fin

Ajout du cas `"lovers"` :
- Titre : "Victoire de l'Amour"
- Message : "[Nom] et [Nom] ont survécu ensemble contre tous."

---

## Écran de paramétrage (refonte `roles-setup.tsx`)

### Flux

1. Arrivée après ajout des joueurs
2. Composition pré-remplie via `getPreset(playerCount)`
3. Badge en haut : "Composition recommandée pour {n} joueurs"
4. Liste des rôles avec compteurs +/- groupés :
   - Loups-Garous (style rouge/sombre)
   - Rôles spéciaux du village (emoji + nom + courte description + compteur)
   - Villageois (auto-calculé, lecture seule)
5. Zone de warnings d'équilibrage (orange, non-bloquants)
6. Timer de débat (inchangé)
7. Bouton "Distribuer les rôles"

### Validation

- Au moins 1 Loup-Garou → bloquant
- Au moins 1 Villageois simple restant → warning non-bloquant
- Total rôles sélectionnés = nombre de joueurs → bloquant

---

## Tests

Fichiers de test à créer/modifier :
- `__tests__/nightEngine.test.ts` — ordre de nuit dynamique, skip des rôles morts, première nuit vs suivantes, pouvoirs perdus
- `__tests__/resolution.test.ts` — résolution de nuit et de vote, interactions Salvateur/Ancien/Amoureux/Idiot/Chasseur cascade
- `__tests__/balance.test.ts` — presets, warnings d'équilibrage
- `__tests__/gameReducer.test.ts` — étendre avec les nouvelles actions (SET_LOVERS, SET_SAVIOR_TARGET, SET_RAVEN_TARGET, SET_LITTLE_GIRL_CLUE)
