import { ScrollView, View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { ROLE_REGISTRY, RoleDefinition } from "../game/roles";
import { ROLE_CARDS } from "../theme/roleCards";

function getInterventionBadge(role: RoleDefinition): { label: string; color: string } {
  if (role.firstNightOnly) {
    return { label: "1ère nuit", color: colors.wolfBlue };
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
    return { label: "À sa mort", color: colors.danger };
  }
  return { label: "Passif", color: colors.textMuted };
}

function RoleCard({ role }: { role: RoleDefinition }) {
  const cardImage = ROLE_CARDS[role.id];
  const interventionBadge = getInterventionBadge(role);
  const campBadge =
    role.camp === "village"
      ? { label: "Village", color: colors.success }
      : { label: "Loups", color: colors.danger };

  return (
    <View style={styles.roleCard}>
      <View style={styles.roleImageContainer}>
        {cardImage ? (
          <Image source={cardImage} style={styles.roleImage} resizeMode="cover" />
        ) : (
          <View style={styles.roleEmojiContainer}>
            <Text style={styles.roleEmoji}>{role.emoji}</Text>
          </View>
        )}
      </View>
      <View style={styles.roleContent}>
        <Text style={styles.roleName}>{role.label}</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { borderColor: campBadge.color }]}>
            <Text style={[styles.badgeText, { color: campBadge.color }]}>{campBadge.label}</Text>
          </View>
          <View style={[styles.badge, { borderColor: interventionBadge.color }]}>
            <Text style={[styles.badgeText, { color: interventionBadge.color }]}>
              {interventionBadge.label}
            </Text>
          </View>
        </View>
        <Text style={styles.roleDescription}>{role.description}</Text>
      </View>
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
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </Pressable>

        <Text style={styles.title}>Grimoire des Rôles</Text>

        {/* Village section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDivider, { borderColor: colors.primary }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Camp du Village</Text>
          <View style={[styles.sectionDivider, { borderColor: colors.primary }]} />
        </View>
        {villageRoles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}

        {/* Werewolves section */}
        <View style={[styles.sectionHeader, styles.sectionHeaderSpacing]}>
          <View style={[styles.sectionDivider, { borderColor: colors.danger }]} />
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            Camp des Loups-Garous
          </Text>
          <View style={[styles.sectionDivider, { borderColor: colors.danger }]} />
        </View>
        {werewolfRoles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.cinzelRegular,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 26,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderSpacing: {
    marginTop: 32,
  },
  sectionDivider: {
    flex: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontFamily: fonts.cinzelBold,
    fontSize: 14,
    marginHorizontal: 12,
    textAlign: "center",
  },
  roleCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  roleImageContainer: {
    width: 90,
    minHeight: 90,
  },
  roleImage: {
    width: 90,
    height: "100%",
  },
  roleEmojiContainer: {
    width: 90,
    minHeight: 90,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  roleEmoji: {
    fontSize: 36,
  },
  roleContent: {
    flex: 1,
    padding: 12,
  },
  roleName: {
    fontFamily: fonts.cinzelBold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  roleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
