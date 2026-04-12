import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";
import SafeContainer from "../components/SafeContainer";

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
    render: () => (
      <ImageBackground
        source={require("../assets/night-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 26, color: colors.white, textAlign: "center", marginBottom: 8, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
            La nuit tombe...
          </Text>
          <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 16, color: colors.textSecondary, textAlign: "center", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
            Tout le monde ferme les yeux
          </Text>
        </View>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Transition jour",
    section: "Nuit",
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 26, color: colors.white, textAlign: "center", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
            Le soleil se leve...
          </Text>
        </View>
      </ImageBackground>
    ),
  },
  {
    label: "Nuit: Attente",
    section: "Nuit",
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
    label: "Nuit: Petite Fille",
    section: "Nuit",
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
    label: "Jour: Marque du Corbeau",
    section: "Jour",
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <View style={{
            backgroundColor: colors.glass,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            borderRadius: radii.base,
            padding: spacing.xl,
            alignItems: "center",
            width: "100%",
          }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.warm, letterSpacing: 3, textTransform: "uppercase", marginBottom: spacing.sm }}>
              Jour 2
            </Text>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, color: colors.text, textAlign: "center", marginBottom: spacing.base }}>
              Un joueur porte la marque du Corbeau
            </Text>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, color: "#c084fc", textAlign: "center", marginVertical: spacing.base }}>
              Bob
            </Text>
            <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl }}>
              Il commence le vote avec 2 voix contre lui
            </Text>
          </View>
        </View>
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Débat",
    section: "Jour",
    render: () => (
      <ImageBackground
        source={require("../assets/debat-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <DayDebateView
          timer={{ startedAt: Date.now(), durationMs: 180000 }}
          isHost={true}
          onStartVote={noop}
        />
      </ImageBackground>
    ),
  },
  {
    label: "Jour: Vote",
    section: "Jour",
    render: () => (
      <ImageBackground
        source={require("../assets/sun-transition-background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <DayVoteView
          alivePlayers={MOCK_PLAYERS}
          myPlayerId="1"
          onVote={noopAsync}
          voteLogs={[
            { voter: "Bob", target: "Claire" },
            { voter: "David", target: "Claire" },
          ]}
          voteStatus={{ votedCount: 2, totalVoters: 5 }}
        />
      </ImageBackground>
    ),
  },

  // ── Spécial ──
  {
    label: "Chasseur",
    section: "Special",
    render: () => (
      <HunterView
        isHunter={true}
        alivePlayers={MOCK_PLAYERS}
        myPlayerId="5"
        onShoot={noopAsync}
      />
    ),
  },
  {
    label: "Chasseur: Attente",
    section: "Special",
    render: () => (
      <HunterView
        isHunter={false}
        alivePlayers={MOCK_PLAYERS}
        myPlayerId="5"
        onShoot={noopAsync}
      />
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

  // Full-screen preview mode
  if (activeIndex !== null) {
    const preview = PREVIEWS[activeIndex];
    return (
      <View style={styles.previewContainer}>
        {preview.render()}
        <Pressable
          style={styles.backButton}
          onPress={() => setActiveIndex(null)}
        >
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
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
                onPress={() => setActiveIndex(index)}
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
  previewLabel: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 100,
    color: colors.textMuted,
    fontSize: 12,
  },
});
