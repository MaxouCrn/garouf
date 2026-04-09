import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  ImageBackground,
  StyleSheet,
  Animated,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_REGISTRY, RoleDefinition } from "../game/roles";
import { ROLE_CARDS } from "../theme/roleCards";

function getInterventionBadge(role: RoleDefinition): { label: string; color: string } {
  if (role.firstNightOnly) {
    return { label: "1re nuit", color: colors.wolfBlue };
  }
  if (role.nightOrder !== null && role.activeEveryOtherNight) {
    return { label: "Nuit (1/2)", color: colors.wolfBlue };
  }
  if (role.nightOrder !== null) {
    return { label: "Nuit", color: colors.wolfBlue };
  }
  if (role.id === "village_idiot") {
    return { label: "Jour", color: colors.ember };
  }
  if (role.id === "hunter") {
    return { label: "A sa mort", color: colors.danger };
  }
  return { label: "Passif", color: colors.textMuted };
}

function RoleCard({ role }: { role: RoleDefinition }) {
  const [expanded, setExpanded] = useState(false);
  const cardImage = ROLE_CARDS[role.id];
  const interventionBadge = getInterventionBadge(role);
  const isWolf = role.camp === "werewolves";
  const accentColor = isWolf ? colors.danger : colors.primary;

  return (
    <Pressable
      style={[styles.roleCard, { borderColor: expanded ? accentColor : "rgba(212,160,23,0.15)" }]}
      onPress={() => setExpanded(!expanded)}
    >
      {/* Header row: always visible */}
      <View style={styles.roleHeader}>
        <View style={styles.roleLeft}>
          {cardImage ? (
            <Image source={cardImage} style={styles.roleThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.roleEmojiBox, { backgroundColor: isWolf ? "rgba(233,69,96,0.15)" : "rgba(212,160,23,0.1)" }]}>
              <Text style={styles.roleEmoji}>{role.emoji}</Text>
            </View>
          )}
          <View style={styles.roleNameArea}>
            <Text style={styles.roleName}>{role.label}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: isWolf ? "rgba(233,69,96,0.2)" : "rgba(78,204,163,0.2)" }]}>
                <Text style={[styles.badgeText, { color: isWolf ? colors.danger : colors.success }]}>
                  {isWolf ? "Loups" : "Village"}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${interventionBadge.color}30` }]}>
                <Text style={[styles.badgeText, { color: interventionBadge.color }]}>
                  {interventionBadge.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? "▲" : "▼"}</Text>
      </View>

      {/* Description: only when expanded */}
      {expanded && (
        <View style={styles.roleDescriptionArea}>
          <View style={styles.descriptionDivider} />
          <Text style={styles.roleDescription}>{role.description}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SectionHeader({ title, color, count }: { title: string; color: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionLine, { backgroundColor: color }]} />
      <View style={styles.sectionLabelArea}>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        <Text style={[styles.sectionCount, { color }]}>{count} roles</Text>
      </View>
      <View style={[styles.sectionLine, { backgroundColor: color }]} />
    </View>
  );
}

export default function GrimoireScreen() {
  const router = useRouter();

  const villageRoles = Object.values(ROLE_REGISTRY).filter((r) => r.camp === "village");
  const werewolfRoles = Object.values(ROLE_REGISTRY).filter((r) => r.camp === "werewolves");

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={require("../assets/fond-home.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Retour</Text>
            </Pressable>

            <Text style={styles.title}>Grimoire</Text>
            <Text style={styles.subtitle}>Touche un role pour voir ses pouvoirs</Text>

            {/* Village section */}
            <SectionHeader title="Camp du Village" color={colors.primary} count={villageRoles.length} />
            {villageRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}

            {/* Werewolves section */}
            <SectionHeader title="Camp des Loups" color={colors.danger} count={werewolfRoles.length} />
            {werewolfRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.85)",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 32,
    color: colors.primary,
    textAlign: "center",
    textShadowColor: "rgba(212,160,23,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 24,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    opacity: 0.4,
  },
  sectionLabelArea: {
    alignItems: "center",
    marginHorizontal: 14,
  },
  sectionTitle: {
    fontFamily: fonts.cinzelBold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  // Role card
  roleCard: {
    backgroundColor: "rgba(22,33,62,0.9)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    justifyContent: "space-between",
  },
  roleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  roleThumb: {
    width: 44,
    height: 62,
    borderRadius: 6,
  },
  roleEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleNameArea: {
    marginLeft: 12,
    flex: 1,
  },
  roleName: {
    fontFamily: fonts.cinzelBold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expandIcon: {
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: 8,
  },
  // Expanded description
  roleDescriptionArea: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  descriptionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  roleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingLeft: 56,
  },
  bottomPadding: {
    height: 20,
  },
});
