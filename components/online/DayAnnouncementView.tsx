import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { ANNONCE_DEATH, ANNONCE_NO_DEATH } from "../../assets/sounds/narrator/day/sounds";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Minimum time (ms) the announcement screen stays visible so players can read. */
const MIN_DISPLAY_MS = 5000;
/** Extra delay after narrator audio finishes before auto-advancing. */
const POST_NARRATOR_DELAY_MS = 2000;

interface Props {
  nightDeaths: { id: string; name: string }[];
  isHost: boolean;
  myPlayerId: string;
  onContinue: () => void;
}

export default function DayAnnouncementView({ nightDeaths, isHost, myPlayerId, onContinue }: Props) {
  const isMyDeath = nightDeaths.some((d) => d.id === myPlayerId);
  const [narratorDone, setNarratorDone] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const advanceFired = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Minimum display timer
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Host plays narrator announcement
  useEffect(() => {
    if (!isHost) {
      // Non-host: no audio to play, narrator is "done" immediately
      // (auto-advance is host-only anyway)
      return;
    }

    let mounted = true;
    const source = nightDeaths.length > 0 ? ANNONCE_DEATH : ANNONCE_NO_DEATH;

    async function playAnnounce() {
      try {
        const { sound } = await Audio.Sound.createAsync(pickRandom(source), { volume: 1.0 });
        if (!mounted) { await sound.unloadAsync(); return; }
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish && mounted) {
            setNarratorDone(true);
          }
        });

        await sound.playAsync();
      } catch {
        // If audio fails, mark narrator as done to not block the game
        if (mounted) setNarratorDone(true);
      }
    }

    playAnnounce();
    return () => {
      mounted = false;
      const s = soundRef.current;
      soundRef.current = null;
      s?.stopAsync().then(() => s.unloadAsync());
    };
  }, [isHost, nightDeaths.length]);

  // Auto-advance when narrator is done AND minimum display time has passed
  useEffect(() => {
    if (!isHost || !narratorDone || !minTimePassed || advanceFired.current) return;

    const timer = setTimeout(() => {
      if (!advanceFired.current) {
        advanceFired.current = true;
        onContinue();
      }
    }, POST_NARRATOR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isHost, narratorDone, minTimePassed, onContinue]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le village se reveille...</Text>
      {nightDeaths.length === 0 ? (
        <Text style={styles.message}>Personne n'est mort cette nuit !</Text>
      ) : (
        nightDeaths.map((d) => (
          <Text key={d.id} style={styles.death}>{d.name} a ete elimine(e)</Text>
        ))
      )}
      {isMyDeath && (
        <Text style={styles.eliminated}>Vous avez ete elimine cette nuit...</Text>
      )}
      <Text style={styles.waiting}>Le debat va bientot commencer...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: fonts.cinzelBold, fontSize: 24, color: colors.primary, marginBottom: 24 },
  message: { fontSize: 18, color: colors.success, marginBottom: 16 },
  death: { fontSize: 18, color: colors.danger, marginBottom: 8 },
  eliminated: { fontSize: 18, color: colors.warning, marginTop: 16, textAlign: "center" },
  waiting: { fontSize: 16, color: colors.textSecondary, marginTop: 32, textAlign: "center", fontStyle: "italic" },
});
