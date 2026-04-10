import { useEffect, useRef, useState } from "react";
import { Audio, AVPlaybackSource, AVPlaybackStatus } from "expo-av";
import type { NightStep } from "../context/GameContext";

const AMBIANCE_VOLUME = 0.3;
const DUCKED_VOLUME = 0.05;

export const NARRATOR_SOUNDS: Record<NightStep, AVPlaybackSource | null> = {
  intro: require("../assets/sounds/narrator/night/nightfall_phase.mp3"),
  cupid: require("../assets/sounds/narrator/night/cupidon_phase.mp3"),
  lovers_reveal: null,
  seer: require("../assets/sounds/narrator/night/voyante_phase.mp3"),
  savior: require("../assets/sounds/narrator/night/savior_phase.mp3"),
  werewolves: require("../assets/sounds/narrator/night/loup_garou_phase.mp3"),
  witch: require("../assets/sounds/narrator/night/sorcer_phase.mp3"),
  raven: require("../assets/sounds/narrator/night/raven_phase.mp3"),
  little_girl: require("../assets/sounds/narrator/night/little_girl_phase.mp3"),
  resolution: require("../assets/sounds/narrator/night/morning_phase.mp3"),
};

export const AMBIANCE_SOUND: AVPlaybackSource = require("../assets/sounds/ambiance_music.mp3");
const WEREWOLF_SFX: AVPlaybackSource = require("../assets/sounds/werewolf.mp3");

const NARRATOR_VOLUME = 1.0;
const SFX_VOLUME = 0.25;

export function useNarrator(nightStep: NightStep, enabled = true): { narratorDone: boolean } {
  const [narratorDone, setNarratorDone] = useState(false);
  const ambianceRef = useRef<Audio.Sound | null>(null);
  const narratorRef = useRef<Audio.Sound | null>(null);
  const sfxRef = useRef<Audio.Sound | null>(null);

  // Start ambiance on mount, stop on unmount
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function startAmbiance() {
      try {
        const { sound } = await Audio.Sound.createAsync(AMBIANCE_SOUND, {
          isLooping: true,
          volume: AMBIANCE_VOLUME,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        ambianceRef.current = sound;
        await sound.playAsync();
      } catch {
        // Silently ignore
      }
    }

    startAmbiance();

    return () => {
      mounted = false;
      const s = ambianceRef.current;
      ambianceRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, [enabled]);

  // Play narrator (+ optional SFX) on nightStep change, duck ambiance
  useEffect(() => {
    if (!enabled) return;

    setNarratorDone(false);
    let mounted = true;

    async function playNarrator() {
      // Stop previous narrator if still playing
      try {
        if (narratorRef.current) {
          await narratorRef.current.stopAsync();
          await narratorRef.current.unloadAsync();
          narratorRef.current = null;
        }
      } catch {
        // Ignore
      }

      // Stop previous SFX
      try {
        if (sfxRef.current) {
          await sfxRef.current.stopAsync();
          await sfxRef.current.unloadAsync();
          sfxRef.current = null;
        }
      } catch {
        // Ignore
      }

      const source = NARRATOR_SOUNDS[nightStep];
      if (!source) return;

      try {
        // Duck ambiance
        await ambianceRef.current?.setVolumeAsync(DUCKED_VOLUME);

        const { sound } = await Audio.Sound.createAsync(source, {
          volume: NARRATOR_VOLUME,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        narratorRef.current = sound;

        // Restore ambiance when narrator finishes & signal done
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            ambianceRef.current?.setVolumeAsync(AMBIANCE_VOLUME);
            if (mounted) setNarratorDone(true);
          }
        });

        // Play werewolf SFX alongside narrator during werewolves step
        if (nightStep === "werewolves") {
          try {
            const { sound: sfx } = await Audio.Sound.createAsync(WEREWOLF_SFX, {
              volume: SFX_VOLUME,
            });
            if (!mounted) {
              await sfx.unloadAsync();
            } else {
              sfxRef.current = sfx;
              await sfx.playAsync();
            }
          } catch {
            // SFX failure is non-critical
          }
        }

        await sound.playAsync();
      } catch {
        // If narrator fails, restore ambiance volume
        ambianceRef.current?.setVolumeAsync(AMBIANCE_VOLUME);
      }
    }

    playNarrator();

    return () => {
      mounted = false;
      // Restore ambiance volume when step changes mid-narration
      ambianceRef.current?.setVolumeAsync(AMBIANCE_VOLUME);
    };
  }, [nightStep, enabled]);

  // Cleanup narrator + SFX on unmount
  useEffect(() => {
    return () => {
      const n = narratorRef.current;
      narratorRef.current = null;
      n?.stopAsync().then(() => n.unloadAsync());

      const s = sfxRef.current;
      sfxRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, []);

  return { narratorDone };
}
