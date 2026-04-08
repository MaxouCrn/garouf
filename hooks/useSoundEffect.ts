import { useEffect, useRef, useCallback } from "react";
import { Audio, AVPlaybackSource } from "expo-av";

export function useSoundEffect(source: AVPlaybackSource | null) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const play = useCallback(async () => {
    if (!source) return;
    try {
      // Unload previous instance if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(source);
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // Silently ignore — file might not exist yet
    }
  }, [source]);

  const stop = useCallback(async () => {
    try {
      await soundRef.current?.stopAsync();
    } catch {
      // Ignore
    }
  }, []);

  return { play, stop };
}

export function useLoopingSound(source: AVPlaybackSource | null) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const start = useCallback(async () => {
    if (!source) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(source, {
        isLooping: true,
        volume: 0.3,
      });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // Silently ignore
    }
  }, [source]);

  const stop = useCallback(async () => {
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
    } catch {
      // Ignore
    }
  }, []);

  return { start, stop };
}
