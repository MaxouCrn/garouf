import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Audio, AVPlaybackSource } from "expo-av";
import { useMusicContext } from "../context/MusicContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";
import SafeContainer from "../components/SafeContainer";
import GCardFrame from "../components/GCardFrame";

// Online view components
import DistributionView from "../components/online/DistributionView";
import NightWaitView from "../components/online/NightWaitView";
import NightActionView from "../components/online/NightActionView";
import WitchActionView from "../components/online/WitchActionView";
import WolfVoteView from "../components/online/WolfVoteView";
import LittleGirlView from "../components/online/LittleGirlView";
import DayAnnouncementView from "../components/online/DayAnnouncementView";
import DayDebateView from "../components/online/DayDebateView";
import DayVoteView from "../components/online/DayVoteView";
import HunterView from "../components/online/HunterView";
import SpectatorView from "../components/online/SpectatorView";
import EndView from "../components/online/EndView";
import PausedView from "../components/online/PausedView";

import type { NightActionRequiredPayload } from "../types/online";

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PLAYERS = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
  { id: "3", name: "Claire" },
  { id: "4", name: "David" },
  { id: "5", name: "Emma" },
];

const mockSeerAction: NightActionRequiredPayload = {
  step: "seer",
  targets: MOCK_PLAYERS,
  instruction: "Voyante, choisis un joueur a inspecter",
  timerSeconds: 30,
};

const mockWitchAction: NightActionRequiredPayload = {
  step: "witch",
  targets: MOCK_PLAYERS,
  instruction: "Sorciere, utilise tes potions",
  timerSeconds: 30,
  werewolfTarget: { id: "3", name: "Claire" },
  potions: { life: true, death: true },
};

const mockWitchActionDepleted: NightActionRequiredPayload = {
  step: "witch",
  targets: MOCK_PLAYERS,
  instruction: "Sorciere, utilise tes potions",
  timerSeconds: 30,
  werewolfTarget: { id: "3", name: "Claire" },
  potions: { life: false, death: false },
};

const mockWolfAction: NightActionRequiredPayload = {
  step: "werewolves",
  targets: MOCK_PLAYERS.filter((p) => p.id !== "1" && p.id !== "2"),
  instruction: "Loups-Garous, choisissez votre victime",
  timerSeconds: 30,
};

const mockRavenAction: NightActionRequiredPayload = {
  step: "raven",
  targets: MOCK_PLAYERS,
  instruction: "Corbeau, designe un joueur a marquer",
  timerSeconds: 30,
};

const mockSaviorAction: NightActionRequiredPayload = {
  step: "savior",
  targets: MOCK_PLAYERS,
  instruction: "Salvateur, choisis un joueur a proteger",
  timerSeconds: 30,
};

const mockCupidAction: NightActionRequiredPayload = {
  step: "cupid",
  targets: MOCK_PLAYERS,
  instruction: "Cupidon, designe deux amoureux",
  timerSeconds: 30,
};

const noop = () => {};
const noopAsync = async () => {};

// ── Preview registry ─────────────────────────────────────────────────────────

interface PreviewEntry {
  label: string;
  section: string;
  render: () => React.ReactNode;
  audio?: AVPlaybackSource;
  sfx?: AVPlaybackSource;
}

const PREVIEWS: PreviewEntry[] = [
  // ── Distribution ──
  {
    label: "Distribution (role caché)",
    section: "Distribution",
    render: () => (
      <DistributionView
        role="seer"
        description="Chaque nuit, la Voyante peut decouvrir la veritable identite d'un joueur."
        isHost={false}
        onStartNight={noop}
        onReady={noop}
        readyCount={3}
        totalPlayers={6}
      />
    ),
  },
  {
    label: "Distribution (host)",
    section: "Distribution",
    render: () => (
      <DistributionView
        role="werewolf"
        description="Chaque nuit, les Loups-Garous designent une victime."
        isHost={true}
        onStartNight={noop}
        onReady={noop}
        readyCount={6}
        totalPlayers={6}
      />
    ),
  },

  // ── Nuit ──
  {
    label: "Nuit: Transition nuit",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/nightfall_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,14,22,0.6)" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, zIndex: 1 }}>
          <GCardFrame variant="glass" corners style={{ alignSelf: 'stretch' }}>
            <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 36, color: colors.text, textAlign: "center", marginBottom: 10 }}>
                La nuit tombe
              </Text>
              <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 20, color: colors.textSecondary, textAlign: "center" }}>
                Tout le monde ferme les yeux
              </Text>
            </View>
          </GCardFrame>
        </View>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Transition jour",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/morning_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,14,22,0.5)" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, zIndex: 1 }}>
          <GCardFrame variant="glass" corners style={{ alignSelf: 'stretch' }}>
            <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 36, color: colors.text, textAlign: "center" }}>
                Le soleil se leve
              </Text>
              <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 20, color: colors.textSecondary, textAlign: "center", marginTop: 10 }}>
                Tout le monde ouvre les yeux
              </Text>
            </View>
          </GCardFrame>
        </View>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Attente",
    section: "Nuit",
    audio: require("../assets/sounds/ambiance_music.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <NightWaitView step="werewolves" />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Voyante",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/voyante_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <NightActionView action={mockSeerAction} onSubmit={noop} />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Loups-Garous",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/loup_garou_phase.mp3"),
    sfx: require("../assets/sounds/werewolf.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <WolfVoteView
            action={mockWolfAction}
            wolfVotes={{ "3": 1, "4": 2 }}
            onSubmit={noop}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Sorcière",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/sorcer_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <WitchActionView action={mockWitchAction} onSubmit={noop} />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Sorcière (potions utilisées)",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/sorcer_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <WitchActionView action={mockWitchActionDepleted} onSubmit={noop} />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Petite Fille",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/little_girl_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <LittleGirlView
            clueNames={["Alice", "Bob"]}
            timerSeconds={15}
            onDone={noop}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },

  {
    label: "Nuit: Salvateur",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/savior_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <NightActionView action={mockSaviorAction} onSubmit={noop} />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Corbeau",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/raven_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <NightActionView action={mockRavenAction} onSubmit={noop} />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Cupidon",
    section: "Nuit",
    audio: require("../assets/sounds/narrator/night/cupidon_phase.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <NightActionView action={mockCupidAction} onSubmit={noop} />
        </SafeContainer>
      </ImageBackground>
    ),
  },

  // ── Jour ──
  {
    label: "Jour: Annonce des morts",
    section: "Jour",
    audio: require("../assets/sounds/narrator/day/death/annonce-death-1.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <DayAnnouncementView
          nightDeaths={[{ id: "3", name: "Claire" }]}
          isHost={false}
          myPlayerId="1"
          onContinue={noop}
        />
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Annonce — aucun mort",
    section: "Jour",
    audio: require("../assets/sounds/narrator/day/no-death/annonce-no-death-1.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <DayAnnouncementView
          nightDeaths={[]}
          isHost={false}
          myPlayerId="1"
          onContinue={noop}
        />
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Marque du Corbeau",
    section: "Jour",
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <GCardFrame variant="glass" corners style={{ alignSelf: "stretch" }}>
            <View style={{ alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.md }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, color: colors.text, textAlign: "center", marginBottom: spacing.base }}>
                Un joueur porte la marque du Corbeau
              </Text>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, color: "#c084fc", textAlign: "center", marginVertical: spacing.base }}>
                {"\u{1F426}\u{200D}\u{2B1B}"} Bob
              </Text>
              <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl }}>
                Il commence le vote avec 2 voix contre lui
              </Text>
            </View>
          </GCardFrame>
        </View>
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Débat",
    section: "Jour",
    audio: require("../assets/sounds/debat-music.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/debat-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <SafeContainer>
          <DayDebateView
            timer={{ startedAt: Date.now(), durationMs: 180000 }}
            isHost={true}
            onStartVote={noop}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Vote",
    section: "Jour",
    render: () => (
      <ImageBackground
        source={require("../assets/sunset-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,14,22,0.3)" }} />
        <SafeContainer>
          <DayVoteView
            alivePlayers={MOCK_PLAYERS}
            myPlayerId="1"
            onVote={noopAsync}
            voteLogs={[]}
            voteStatus={{ votedCount: 0, totalVoters: 5 }}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Logs de vote",
    section: "Jour",
    render: () => (
      <ImageBackground
        source={require("../assets/sunset-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,14,22,0.3)" }} />
        <SafeContainer>
          <DayVoteView
            alivePlayers={MOCK_PLAYERS}
            myPlayerId="1"
            onVote={noopAsync}
            initialVoted
            voteLogs={[
              { voter: "Bob", target: "Claire" },
              { voter: "David", target: "Claire" },
              { voter: "Alice", target: "Bob" },
              { voter: "Claire", target: "David" },
              { voter: "Emma", target: "Claire" },
            ]}
            voteStatus={{ votedCount: 5, totalVoters: 6 }}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },

  // ── Spécial ──
  {
    label: "Chasseur",
    section: "Special",
    audio: require("../assets/sounds/bruitages/gunfire-chasseur.mp3"),
    render: () => (
      <ImageBackground
        source={require("../assets/sunset-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,14,22,0.4)" }} />
        <SafeContainer>
          <HunterView
            isHunter={true}
            alivePlayers={MOCK_PLAYERS}
            myPlayerId="5"
            onShoot={noopAsync}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Chasseur: Attente",
    section: "Special",
    render: () => (
      <ImageBackground
        source={require("../assets/sunset-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,14,22,0.5)" }} />
        <SafeContainer>
          <HunterView
            isHunter={false}
            alivePlayers={MOCK_PLAYERS}
            myPlayerId="5"
            onShoot={noopAsync}
          />
        </SafeContainer>
      </ImageBackground>
    ),
  },
  {
    label: "Spectateur (éliminé)",
    section: "Special",
    render: () => <SpectatorView phase="night" nightStep="werewolves" />,
  },
  {
    label: "Pause (déconnexion)",
    section: "Special",
    render: () => (
      <PausedView
        info={{
          reason: "player_disconnected",
          disconnectedPlayer: "Bob",
          resumeIn: 45,
        }}
      />
    ),
  },

  // ── Fin ──
  {
    label: "Victoire Village",
    section: "Fin",
    render: () => <EndView winner="villagers" />,
  },
  {
    label: "Victoire Loups",
    section: "Fin",
    render: () => <EndView winner="werewolves" />,
  },
  {
    label: "Victoire Amoureux",
    section: "Fin",
    render: () => <EndView winner="lovers" />,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function DevScreen() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const sfxRef = useRef<Audio.Sound | null>(null);
  const { stopMusic, startMusic } = useMusicContext();

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (sfxRef.current) {
      await sfxRef.current.stopAsync();
      await sfxRef.current.unloadAsync();
      sfxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggleAudio = useCallback(async (source: AVPlaybackSource, sfxSource?: AVPlaybackSource) => {
    if (isPlaying) {
      await stopAudio();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    soundRef.current = sound;
    setIsPlaying(true);

    if (sfxSource) {
      try {
        const { sound: sfx } = await Audio.Sound.createAsync(sfxSource, { shouldPlay: true, volume: 0.25 });
        sfxRef.current = sfx;
      } catch {
        // SFX failure is non-critical
      }
    }

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        stopAudio();
      }
    });
  }, [isPlaying, stopAudio]);

  const handleOpenPreview = useCallback((index: number) => {
    stopMusic();
    setActiveIndex(index);
  }, [stopMusic]);

  const handleBack = useCallback(async () => {
    await stopAudio();
    startMusic();
    setActiveIndex(null);
  }, [stopAudio, startMusic]);

  // Full-screen preview mode
  if (activeIndex !== null) {
    const preview = PREVIEWS[activeIndex];
    return (
      <View style={styles.previewContainer}>
        {preview.render()}
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        {preview.audio && (
          <Pressable
            style={[styles.audioButton, isPlaying && styles.audioButtonActive]}
            onPress={() => toggleAudio(preview.audio!, preview.sfx)}
          >
            <Text style={styles.audioButtonText}>{isPlaying ? "⏹ Stop" : "▶ Audio Narrateur"}</Text>
          </Pressable>
        )}
        <Text style={styles.previewLabel}>{preview.label}</Text>
      </View>
    );
  }

  // Catalog mode
  const sections = PREVIEWS.reduce<Record<string, { index: number; label: string }[]>>(
    (acc, entry, index) => {
      if (!acc[entry.section]) acc[entry.section] = [];
      acc[entry.section].push({ index, label: entry.label });
      return acc;
    },
    {}
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dev Tools</Text>
      <Text style={styles.subtitle}>
        Catalogue de composants — tap pour preview plein ecran
      </Text>

      {Object.entries(sections).map(([section, items]) => (
        <View key={section}>
          <Text style={styles.sectionTitle}>{section}</Text>
          <View style={styles.presetRow}>
            {items.map(({ index, label }) => (
              <Pressable
                key={index}
                style={styles.presetButton}
                onPress={() => handleOpenPreview(index)}
              >
                <Text style={styles.presetText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: fonts.displayBold,
    color: colors.accent,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radii.base,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: {
    color: colors.accent,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
  },
  // Preview mode
  previewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.base,
  },
  backText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: fonts.bodySemiBold,
  },
  audioButton: {
    position: "absolute",
    top: 50,
    left: 110,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.base,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  audioButtonActive: {
    backgroundColor: "rgba(126,184,218,0.25)",
  },
  audioButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: fonts.bodySemiBold,
  },
  previewLabel: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 100,
    color: colors.textMuted,
    fontSize: 12,
  },
});
