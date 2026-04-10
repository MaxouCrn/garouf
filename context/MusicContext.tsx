import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Audio } from "expo-av";

const HOME_MUSIC = require("../assets/sounds/home-music.mp3");
const MUSIC_VOLUME = 0.4;

interface MusicContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  startMusic: () => void;
  stopMusic: () => void;
}

const MusicContext = createContext<MusicContextValue>({
  isMuted: false,
  toggleMute: () => {},
  startMusic: () => {},
  stopMusic: () => {},
});

export function useMusicContext() {
  return useContext(MusicContext);
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const pendingPlayRef = useRef(false);

  // Load sound once
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(HOME_MUSIC, {
          isLooping: true,
          volume: MUSIC_VOLUME,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          await sound.playAsync();
          setIsPlaying(true);
        }
      } catch {
        // Silently ignore
      }
    }

    load();

    return () => {
      mounted = false;
      const s = soundRef.current;
      soundRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, []);

  const startMusic = async () => {
    if (isPlaying) return;
    if (!soundRef.current) {
      pendingPlayRef.current = true;
      return;
    }
    try {
      if (!isMuted) {
        await soundRef.current.setVolumeAsync(MUSIC_VOLUME);
      }
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch {
      // Ignore
    }
  };

  const stopMusic = async () => {
    if (!soundRef.current || !isPlaying) return;
    try {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    } catch {
      // Ignore
    }
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try {
      await soundRef.current?.setVolumeAsync(newMuted ? 0 : MUSIC_VOLUME);
    } catch {
      // Ignore
    }
  };

  return (
    <MusicContext.Provider value={{ isMuted, toggleMute, startMusic, stopMusic }}>
      {children}
    </MusicContext.Provider>
  );
}
