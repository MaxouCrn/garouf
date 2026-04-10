# Design : Correction des bugs du mode online

**Date** : 2026-04-10
**Contexte** : Le mode online (Supabase Realtime + Edge Functions) présente plusieurs bugs qui cassent l'expérience de jeu. Les phases ne se jouent pas dans le même ordre que le mode local, la voyante ne peut pas voir les cartes, le vote est instable.

---

## Bug 1 : Phase "intro" de nuit sautée

### Cause racine
Dans `supabase/functions/start-night/index.ts`, le serveur broadcaste `night:step: "intro"` puis avance immédiatement au step suivant et broadcaste un second `night:step`. Le client n'a pas le temps d'afficher l'animation "La nuit tombe...".

### Correction
- **Serveur (`start-night/index.ts`)** : Supprimer l'auto-avancement après le broadcast d'intro. Sauvegarder `snapshot.currentNightStep = "intro"` et `snapshot.nightStepIndex = 0` en DB. Ne broadcaster que `night:step: "intro"`.
- **Client (`app/online/game.tsx`)** : Quand `nightStep === "intro"`, afficher l'animation pendant 4 secondes. Après le délai, le client host envoie automatiquement `night-action` avec `actionType: "advance_intro"` pour avancer au premier vrai step. Les non-host voient l'animation et attendent le broadcast.

### Fichiers impactés
- `supabase/functions/start-night/index.ts` (supprimer auto-avancement lignes ~88-94)
- `app/online/game.tsx` (ajouter timer auto 4s sur le rendu intro)

---

## Bug 2 : Phase "resolution" sautée

### Cause racine
Dans `supabase/functions/night-action/index.ts`, quand `currentNightStep === "resolution"`, le serveur calcule les morts, met à jour les joueurs en DB, et passe directement à `phase: "day"` sans jamais laisser le client afficher l'animation sunrise ni la liste des morts de la nuit.

### Correction
Séparer la résolution en deux temps :

1. **Étape "resolution" visible** : Quand le dernier step actif de la nuit est traité et que le serveur avance à "resolution", il calcule les morts, met à jour le snapshot (`nightDeaths`, joueurs morts en DB), mais **garde `phase: "night"` et `currentNightStep: "resolution"`**. Il broadcaste `night:step: "resolution"` avec `nightDeaths` dans le payload.

2. **Transition effective** : Côté client, quand `nightStep === "resolution"`, afficher l'animation sunrise (3s) + la liste des morts. Après le délai, le client host envoie `night-action` avec `actionType: "resolve_night"` qui effectue la transition vers `phase: "day"` (ou `"hunter"` / `"end"`).

### Fichiers impactés
- `supabase/functions/night-action/index.ts` (séparer le traitement de resolution en deux : calcul des morts vs transition de phase)
- `app/online/game.tsx` (ajouter rendu resolution avec animation sunrise 3s + timer auto)
- `hooks/useOnlineGame.ts` (stocker `nightDeaths` depuis le payload du broadcast resolution)

---

## Bug 3 : Phase "announcement" du jour manquante

### Cause racine
`daySubPhase` n'est jamais reset à `"announcement"` quand le jeu repasse en phase `"day"`. Il conserve la valeur `"vote"` de la journée précédente. Le client tombe donc directement dans le rendu du vote au lieu de l'annonce des morts.

### Correction
Deux points de correction :

1. **Serveur** : Dans `night-action/index.ts` (quand resolution passe à `phase: "day"`) et `hunter-shoot/index.ts`, ajouter `snapshot.daySubPhase = "announcement"` avant de sauvegarder le snapshot.
2. **Client** : Dans le handler du broadcast `"game:phase"` dans `useOnlineGame.ts`, quand `phase === "day"`, forcer `daySubPhase: "announcement"` dans le state.

### Fichiers impactés
- `supabase/functions/night-action/index.ts` (ajouter `snapshot.daySubPhase = "announcement"`)
- `supabase/functions/hunter-shoot/index.ts` (idem si transition vers "day")
- `hooks/useOnlineGame.ts` (reset daySubPhase dans handler "game:phase")

---

## Bug 4 : Voyante - carte invisible (race condition)

### Cause racine
Quand la voyante inspecte un joueur, le serveur retourne le `seerResult` dans la réponse HTTP mais avance immédiatement au step suivant et broadcaste `night:step`. Côté client, un `useEffect` reset `seerResult` à `null` quand `nightStep` change, effacant le résultat avant qu'il ne soit visible.

### Correction
- **Serveur (`night-action/index.ts`)** : Quand `actionType === "seer_inspect"`, ne pas avancer au step suivant. Garder `currentNightStep: "seer"` en DB. Retourner le `seerResult` dans la réponse HTTP.
- **Client (`app/online/game.tsx`)** : Quand `seerResult` est recu, afficher la carte pendant 4 secondes. Après le délai, le client envoie automatiquement `night-action` avec `actionType: "seer_done"` pour avancer au step suivant.
- **Serveur (`night-action/index.ts`)** : Ajouter un handler pour `actionType: "seer_done"` qui avance au step suivant (même logique que l'avancement actuel).
- **Client (`app/online/game.tsx`)** : Supprimer le `useEffect` qui reset `seerResult` sur changement de `nightStep`.

### Fichiers impactés
- `supabase/functions/night-action/index.ts` (ne pas avancer après seer_inspect, ajouter handler seer_done)
- `app/online/game.tsx` (timer 4s après seerResult, supprimer useEffect de reset)

---

## Bug 5 : Bouton "Passer au vote" caché pour le host

### Cause racine
Dans `components/online/DayDebateView.tsx`, la condition d'affichage du bouton est `{isOver && isHost}`. Le bouton n'apparait que quand `remaining === 0`.

### Correction
Changer la condition en `{isHost}` pour que le host voie toujours le bouton "Passer au vote", quel que soit l'état du timer. Les non-host continuent de ne voir que le timer et le message d'attente.

### Fichiers impactés
- `components/online/DayDebateView.tsx` (modifier la condition d'affichage du bouton)

---

## Bug 6 : Liste des joueurs instable pendant le vote

### Cause racine
La requete Supabase dans `reconnect/index.ts` n'a pas de `ORDER BY`. L'ordre des joueurs peut changer a chaque poll (toutes les 2s). De plus, `alivePlayers` est une nouvelle reference array a chaque poll, forcant un re-render complet de la FlatList dans `DayVoteView.tsx`.

### Correction
1. **Serveur (`reconnect/index.ts`)** : Ajouter `.order("joined_at", { ascending: true })` a la requete des joueurs pour garantir un ordre stable et deterministe.
2. **Client (`DayVoteView.tsx`)** : Memoriser la liste filtrée avec `useMemo` basé sur les IDs des joueurs pour eviter les re-renders quand le contenu n'a pas changé.

### Fichiers impactés
- `supabase/functions/reconnect/index.ts` (ajouter ORDER BY)
- `components/online/DayVoteView.tsx` (useMemo sur la liste)

---

## Résumé des fichiers a modifier

| Fichier | Bugs concernés |
|---------|---------------|
| `supabase/functions/start-night/index.ts` | #1 |
| `supabase/functions/night-action/index.ts` | #2, #3, #4 |
| `supabase/functions/hunter-shoot/index.ts` | #3 |
| `supabase/functions/reconnect/index.ts` | #6 |
| `app/online/game.tsx` | #1, #2, #4 |
| `hooks/useOnlineGame.ts` | #3 |
| `components/online/DayDebateView.tsx` | #5 |
| `components/online/DayVoteView.tsx` | #6 |

## Ordre d'implémentation recommandé

1. **Bug 3** (daySubPhase reset) — fix le plus simple, impact immédiat
2. **Bug 5** (bouton host) — une ligne a changer
3. **Bug 6** (liste stable) — ORDER BY + useMemo
4. **Bug 1** (intro) — supprimer auto-avancement + timer client
5. **Bug 4** (voyante) — pattern similaire au fix intro (ne pas avancer, timer client)
6. **Bug 2** (resolution) — le plus complexe, séparer en deux temps
