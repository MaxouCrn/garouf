import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing, radii } from "../../theme/spacing";
import GCardFrame from "../GCardFrame";
import GButton from "../GButton";
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
      <GCardFrame variant="glass" corners style={{ alignSelf: "stretch" }}>
        <View style={styles.inner}>
          <Text style={styles.timer}>{minutes}:{seconds.toString().padStart(2, "0")}</Text>
          <Text style={styles.timerLabel}>Temps de debat restant</Text>

          {!isOver && !isHost && (
            <Text style={styles.hint}>Discutez et trouvez les loups !</Text>
          )}

          {isOver && !isHost && (
            <Text style={styles.waiting}>En attente du vote...</Text>
          )}

          {isHost && (
            <View style={styles.actions}>
              <GButton variant="outline" onPress={onStartVote}>
                Passer au vote
              </GButton>
            </View>
          )}

          {isHost && (
            <Pressable style={styles.muteButton} onPress={() => setIsMuted((m) => !m)}>
              <Text style={styles.muteEmoji}>{isMuted ? "\u{1F507}" : "\u{1F50A}"}</Text>
            </Pressable>
          )}
        </View>
      </GCardFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  inner: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 72,
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 4,
  },
  timerLabel: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: colors.white,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.xl,
  },
  hint: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  waiting: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  actions: {
    alignItems: "center",
    gap: spacing.md,
  },
  muteButton: {
    marginTop: spacing.xxxl,
  },
  muteEmoji: {
    fontSize: 28,
  },
});
