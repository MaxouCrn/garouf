# Dev Phase Preview — Design Spec

## Objectif

Permettre de naviguer directement vers n'importe quel ecran de phase (local et online) sans lancer de partie, afin de travailler l'UI/UX. L'utilisateur dispose d'un editeur JSON du GameState complet avec des presets realistes par phase.

## Perimetre

- Mode local : setup_players, setup_roles, distribution, night, day, hunter, end
- Mode online : lobby, distribution, game
- Accessible uniquement en `__DEV__`

## 1. Action SET_STATE dans le reducer

Ajouter une action `SET_STATE` au type `GameAction` dans `context/GameContext.tsx` :

```typescript
| { type: "SET_STATE"; payload: GameState }
```

Case dans `gameReducer` :

```typescript
case "SET_STATE":
  if (__DEV__) return action.payload;
  return state;
```

Remplace le state entier. Le guard `__DEV__` empeche toute utilisation en production.

## 2. Ecran Dev Tools — `app/dev.tsx`

### Point d'entree

Bouton "Dev Tools" sur `index.tsx`, conditionne par `__DEV__`, qui navigue vers `/dev`.

### Route

Ajoutee au Stack dans `app/_layout.tsx`.

### Contenu de l'ecran

- **Liste des phases** : boutons pour chaque phase locale et online. Un tap charge le preset JSON correspondant dans l'editeur.
- **Editeur JSON** : `TextInput` multiline scrollable affichant le state JSON formate (`JSON.stringify(state, null, 2)`). Editable librement.
- **Validation** : si le JSON ne parse pas, message d'erreur rouge sous l'editeur. Bouton "Lancer" desactive.
- **Bouton "Lancer"** : dispatch `SET_STATE` avec le JSON parse, puis `router.replace()` vers la route de la phase.

### Style

Dark theme (coherent avec `theme/colors.ts`). Pas besoin de polish — c'est un outil dev.

## 3. Presets — `game/devPresets.ts`

Fichier exportant `DEV_PRESETS: Record<string, GameState>` avec des presets realistes.

### Presets locaux

| Cle | Phase | Description |
|---|---|---|
| `setup_players` | setup_players | 6 joueurs sans roles |
| `setup_roles` | setup_roles | 6 joueurs, selectedRoles pre-rempli (2 loups, voyante, sorciere, chasseur, villageois) |
| `distribution` | distribution | 6 joueurs avec roles assignes, distributionIndex=0 |
| `night` | night | 5 vivants + 1 mort, nightSteps calcules, nightStep="intro", turn=2 |
| `day` | day | 4 vivants, nightDeaths avec 1 mort, debateTimerMinutes=3 |
| `hunter` | hunter | chasseur mort, hunterContext="day" |
| `end` | end | winner="villagers", quelques morts, turn=4 |

### Presets online

| Cle | Phase | Description |
|---|---|---|
| `online_lobby` | setup_roles | etat minimal pour vue lobby |
| `online_distribution` | distribution | etat distribution online |
| `online_game` | night | etat partie en cours |

### Donnees communes

- Noms de joueurs : Alice, Bob, Claire, David, Emma, Fabien
- Roles assignes de maniere coherente avec la phase
- Chaque preset est un `GameState` complet et valide

## 4. Navigation apres dispatch

Mapping phase vers route dans `app/dev.tsx` :

| Phase | Route locale | Route online |
|---|---|---|
| setup_players | /players-setup | — |
| setup_roles | /roles-setup | /online/lobby |
| distribution | /distribution | /online/game |
| night | /night | /online/game |
| day | /day | — |
| hunter | /hunter | — |
| end | /end | — |

Navigation via `router.replace()` dans le callback du bouton "Lancer" (action utilisateur explicite, pas useEffect).

Pour les presets online : l'apercu est limite au rendu visuel (pas d'interactions temps reel Supabase). Acceptable pour du travail UI/UX.

## 5. Fichiers impactes

| Fichier | Modification |
|---|---|
| `context/GameContext.tsx` | Ajouter `SET_STATE` a `GameAction` et au reducer |
| `game/devPresets.ts` | Nouveau fichier — presets par phase |
| `app/dev.tsx` | Nouveau fichier — ecran Dev Tools |
| `app/index.tsx` | Ajouter bouton "Dev Tools" conditionne `__DEV__` |
| `app/_layout.tsx` | Ajouter route `/dev` au Stack |
