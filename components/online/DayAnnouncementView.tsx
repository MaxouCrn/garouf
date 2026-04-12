import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing, radii } from "../../theme/spacing";
import GCardFrame from "../GCardFrame";
import { ANNONCE_DEATH, ANNONCE_NO_DEATH } from "../../assets/sounds/narrator/day/sounds";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function AnimatedDots({ text }: { text: string }) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.waiting}>
      {text}{".".repeat(dotCount)}
    </Text>
  );
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
    if (!isHost) return;

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
      <GCardFrame variant="glass" corners style={{ alignSelf: "stretch" }}>
        <View style={styles.inner}>
          <Text style={styles.title}>Le village se reveille</Text>

          {nightDeaths.length === 0 ? (
            <Text style={styles.noDeath}>Personne n'est mort cette nuit !</Text>
          ) : (
            <>
              <Text style={styles.message}>Cette nuit, le village a perdu :</Text>
              {nightDeaths.map((d) => (
                <Text key={d.id} style={styles.deadName}>{"\u{1F480}"} {d.name}</Text>
              ))}
            </>
          )}

          {isMyDeath && (
            <Text style={styles.eliminated}>Vous avez ete elimine cette nuit...</Text>
          )}

          <AnimatedDots text="Le debat va bientot commencer" />
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
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.base,
  },
  message: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  deadName: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.danger,
    textAlign: "center",
    marginVertical: spacing.sm,
  },
  noDeath: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.success,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  eliminated: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.warm,
    marginTop: spacing.base,
    textAlign: "center",
  },
  waiting: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.white,
    fontStyle: "italic",
    marginTop: spacing.lg,
    letterSpacing: 1,
  },
});
