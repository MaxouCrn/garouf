# Night Narrator — Design Spec

## Overview

Add a vocal narrator that announces each night phase with pre-recorded French phrases. An ambiance music loop plays throughout the night, with volume ducking when the narrator speaks.

## Audio Assets

All narrator files are pre-generated via ElevenLabs and stored in `assets/sounds/narrator/`.

| NightStep     | File                            | Phrase                                                                        |
|---------------|---------------------------------|-------------------------------------------------------------------------------|
| `intro`       | `nightfall_phase.mp3`           | "La nuit tombe sur le village... Fermez tous les yeux."                       |
| `werewolves`  | `loup_garou_phase.mp3`          | "Loups-garous ! Réveillez-vous et choisissez votre victime."                  |
| `seer`        | `voyante_phase.mp3`             | "Voyante ! Ouvre les yeux. Désigne un joueur dont tu veux percer le secret."  |
| `witch`       | `sorcer_phase.mp3`              | "Sorcière ! Ouvre les yeux. Tu peux utiliser tes potions cette nuit."         |
| `resolution`  | `morning_phase.mp3`             | "Le soleil se lève... Tout le monde ouvre les yeux."                          |

Ambiance music: `assets/sounds/ambiance_music.mp3` (looping).

## Hook: `useNarrator`

**File:** `hooks/useNarrator.ts`

**Signature:**
```typescript
function useNarrator(nightStep: NightStep): void
```

**Responsibilities:**
1. Start ambiance music loop on mount, stop on unmount
2. On each `nightStep` change, play the corresponding narrator file
3. Duck ambiance volume while narrator plays, restore after

**Ducking behavior:**
- Normal ambiance volume: **0.3**
- Ducked ambiance volume: **0.05**
- Use `onPlaybackStatusUpdate` on the narrator sound to detect when playback finishes (`didJustFinish`), then restore ambiance volume

**Step transition behavior:**
- When `nightStep` changes mid-narration, the current narrator sound is stopped and unloaded immediately
- The new narrator sound starts, ambiance stays ducked
- No UI blocking — players can interact and advance at any time

## Narrator-to-step mapping

```typescript
const NARRATOR_SOUNDS: Record<NightStep, AVPlaybackSource> = {
  intro: require("../assets/sounds/narrator/nightfall_phase.mp3"),
  werewolves: require("../assets/sounds/narrator/loup_garou_phase.mp3"),
  seer: require("../assets/sounds/narrator/voyante_phase.mp3"),
  witch: require("../assets/sounds/narrator/sorcer_phase.mp3"),
  resolution: require("../assets/sounds/narrator/morning_phase.mp3"),
};
```

## Changes to `night.tsx`

- Remove all individual `useSoundEffect` and `useLoopingSound` hook calls
- Remove the `SOUNDS` constant
- Replace with a single `useNarrator(state.nightStep)` call
- No other UI changes needed

## Changes to `useSoundEffect.ts`

- Keep existing hooks for potential reuse elsewhere
- `useNarrator` is a new hook in its own file, uses `expo-av` directly

## Cleanup

- The standalone `assets/sounds/werewolf.mp3` can be removed since narrator files replace it
- Null placeholders for seer/witch/ambiance sounds in `night.tsx` are no longer needed
