import { useEffect, useRef, useCallback } from "react";
import { createAudioPlayer, AudioPlayer, AudioSource } from "expo-audio";

export function useSoundEffect(source: AudioSource | null) {
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (!source) return;
    const player = createAudioPlayer(source);
    playerRef.current = player;
    return () => {
      player.remove();
      playerRef.current = null;
    };
  }, [source]);

  const play = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  return { play, stop };
}

export function useLoopingSound(source: AudioSource | null) {
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (!source) return;
    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 0.3;
    playerRef.current = player;
    return () => {
      player.remove();
      playerRef.current = null;
    };
  }, [source]);

  const start = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  return { start, stop };
}
