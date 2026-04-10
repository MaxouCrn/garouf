import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { TimerStartPayload } from "../../types/online";

const DEBAT_MUSIC = require("../../assets/sounds/debat-music.mp3");
const DEBAT_VOLUME = 0.4;

interface Props {
  timer: TimerStartPayload | null;
  isHost: boolean;
  onStartVote: () => void;
}

export default function DayDebateView({ timer, isHost, onStartVote }: Props) {
  const [remaining, setRemaining] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef<Audio.Sound | null>(null);

  // Only the host plays debate music
  useEffect(() => {
    if (!isHost) return;
    let mounted = true;

    async function startMusic() {
      try {
        const { sound } = await Audio.Sound.createAsync(DEBAT_MUSIC, {
          isLooping: true,
          volume: DEBAT_VOLUME,
        });
        if (!mounted) { await sound.unloadAsync(); return; }
        musicRef.current = sound;
        await sound.playAsync();
      } catch {
        // Ignore
      }
    }

    startMusic();

    return () => {
      mounted = false;
      const s = musicRef.current;
      musicRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, [isHost]);

  // Handle mute toggle
  useEffect(() => {
    musicRef.current?.setVolumeAsync(isMuted ? 0 : DEBAT_VOLUME);
  }, [isMuted]);

  useEffect(() => {
    if (!timer) return;
    const update = () => {
      const elapsed = Date.now() - timer.startedAt;
      const left = Math.max(0, Math.ceil((timer.durationMs - elapsed) / 1000));
      setRemaining(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isOver = remaining === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debat en cours</Text>
      <Text style={[styles.timer, isOver && styles.timerOver]}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>
      {!isOver && !isHost && (
        <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
      )}
      {isHost && (
        <>
          <Pressable style={styles.muteButton} onPress={() => setIsMuted((m) => !m)}>
            <Text style={styles.muteButtonText}>{isMuted ? "Reactiver la musique" : "Couper la musique"}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onStartVote}>
            <Text style={styles.buttonText}>Passer au vote</Text>
          </Pressable>
        </>
      )}
      {isOver && !isHost && (
        <Text style={styles.waiting}>En attente du vote...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  timer: { fontSize: 64, fontWeight: "bold", color: colors.text },
  timerOver: { color: colors.danger },
  hint: { fontSize: 16, color: colors.textSecondary, marginTop: 24 },
  muteButton: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 24 },
  muteButtonText: { color: colors.textSecondary, fontSize: 14 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12, marginTop: 16 },
  buttonText: { color: colors.black, fontSize: 20, fontWeight: "bold" },
  waiting: { fontSize: 16, color: colors.textSecondary, marginTop: 32, textAlign: "center" },
});
