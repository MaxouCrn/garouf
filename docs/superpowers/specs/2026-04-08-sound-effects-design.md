# Sound Effects — Design Spec

## Contexte

Ajouter des bruitages sonores pendant les phases de nuit du jeu Garouf pour ameliorer l'immersion. Un son par etape de nuit + une ambiance de fond en boucle.

## Librairie

`expo-av` — lecture de fichiers mp3 locaux, support boucle et one-shot.

## Organisation des fichiers audio

```
assets/
  sounds/
    werewolf.mp3            # Hurlement des loups (disponible maintenant)
    night_ambiance.mp3      # (futur) Grillons/vent en boucle pendant la nuit
    seer.mp3                # (futur) Son mystique pour la voyante
    witch.mp3               # (futur) Son potion pour la sorciere
    day.mp3                 # (futur) Lever du jour / chant d'oiseau
```

Le fichier `loup_garou_hurlement.mp3` existant a la racine sera deplace et renomme en `assets/sounds/werewolf.mp3`.

## Hook `useSoundEffect`

Nouveau fichier : `hooks/useSoundEffect.ts`

```typescript
function useSoundEffect(source: AVPlaybackSource | null): {
  play: () => Promise<void>;
  stop: () => Promise<void>;
}
```

- Charge le son au mount, unload au unmount
- `play()` joue le son (no-op si source est null)
- `stop()` arrete le son
- Gere les erreurs silencieusement (pas de crash si fichier absent)

## Hook `useLoopingSound`

Nouveau fichier : partage le meme fichier `hooks/useSoundEffect.ts`

```typescript
function useLoopingSound(source: AVPlaybackSource | null): {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
```

- Meme principe mais joue en boucle (isLooping: true)
- Pour l'ambiance de nuit

## Integration dans night.tsx

### Sons par etape (one-shot)

| NightStep     | Son                  | Statut      |
|---------------|----------------------|-------------|
| werewolves    | `werewolf.mp3`       | Disponible  |
| seer          | `seer.mp3`           | Futur       |
| witch         | `witch.mp3`          | Futur       |

Chaque son est joue quand le `nightStep` change vers l'etape correspondante, via un `useEffect` sur `state.nightStep`.

### Ambiance de nuit (boucle)

`night_ambiance.mp3` demarre quand on entre dans NightScreen et s'arrete au unmount. Non implemente pour l'instant (fichier pas encore fourni).

## Gestion des fichiers futurs

Les sons sont importes via `require()` au niveau du module. Pour les fichiers pas encore fournis, on passe `null` au hook — le hook ne fait rien quand la source est null. Quand l'utilisateur ajoute un fichier mp3 dans `assets/sounds/`, il suffit de mettre a jour l'import et le son sera joue automatiquement.

## Dependances

- `expo-av` (a installer via `npx expo install expo-av`)

## Scope

- Installer `expo-av`
- Deplacer et renommer le mp3 existant
- Creer le hook `useSoundEffect` et `useLoopingSound`
- Brancher le hurlement des loups dans `night.tsx`
- Preparer les slots pour les sons futurs (imports null)
