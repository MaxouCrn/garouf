import { useCallback } from "react";
import { useAudioPlayer, AudioSource } from "expo-audio";

export function useSoundEffect(source: AudioSource | null) {
  const player = useAudioPlayer(source);

  const play = useCallback(() => {
    if (!source) return;
    player.seekTo(0);
    player.play();
  }, [source, player]);

  const stop = useCallback(() => {
    player.pause();
  }, [player]);

  return { play, stop };
}

export function useLoopingSound(source: AudioSource | null) {
  const player = useAudioPlayer(source);

  const start = useCallback(() => {
    if (!source) return;
    player.loop = true;
    player.volume = 0.3;
    player.seekTo(0);
    player.play();
  }, [source, player]);

  const stop = useCallback(() => {
    player.pause();
  }, [player]);

  return { start, stop };
}
