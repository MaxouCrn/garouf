# Witch Night UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the WitchActionView to separate potion status cards from action buttons, eliminating height misalignment between the two potion cards.

**Architecture:** Single-file rewrite of `WitchActionView.tsx`. The JSX layout changes from "two cards with buttons inside" to "two status cards (row) + action buttons (full-width stack below)". All state logic, handlers, and the Props interface remain identical.

**Tech Stack:** React Native, Animated API, existing GCardFrame component, existing theme tokens.

---

### Task 1: Rewrite potion status cards (visual only, no buttons)

**Files:**
- Modify: `components/online/WitchActionView.tsx:109-198` (potionsRow section)

- [ ] **Step 1: Replace potion cards JSX**

Replace the `{/* Potion cards */}` section (lines 109–198) with status-only cards. Remove all `<Pressable>` from inside cards. Each card now contains: image, title, availability indicator.

```tsx
{/* Potion status cards */}
<View style={styles.potionsRow}>
  {/* Life Potion Status */}
  <Animated.View style={[
    styles.potionAnimWrapper,
    lifeAvailable && { transform: [{ scale: lifePulse }] },
  ]}>
    <GCardFrame
      variant="glass"
      corners
      cornerColor={colors.danger}
      style={[
        styles.potionCard,
        styles.potionCardLife,
        heal && styles.potionCardLifeActive,
        !lifeAvailable && styles.potionCardDepleted,
      ]}
    >
      <View style={styles.potionContent}>
        <Image source={require("../../assets/health-potion.png")} style={styles.potionImage} resizeMode="contain" />
        <Text style={styles.potionTitle}>Vie</Text>
        {!lifeAvailable ? (
          <View style={styles.depletedBadge}>
            <Text style={styles.depletedText}>Epuisee</Text>
          </View>
        ) : (
          <View style={[styles.availableDot, { backgroundColor: colors.success }]} />
        )}
      </View>
    </GCardFrame>
  </Animated.View>

  {/* Death Potion Status */}
  <Animated.View style={[
    styles.potionAnimWrapper,
    deathAvailable && { transform: [{ scale: deathPulse }] },
  ]}>
    <GCardFrame
      variant="glass"
      corners
      cornerColor={colors.success}
      style={[
        styles.potionCard,
        styles.potionCardDeath,
        !!killTargetId && styles.potionCardDeathActive,
        !deathAvailable && styles.potionCardDepleted,
      ]}
    >
      <View style={styles.potionContent}>
        <Image source={require("../../assets/poison-potion.png")} style={styles.potionImage} resizeMode="contain" />
        <Text style={styles.potionTitle}>Mort</Text>
        {!deathAvailable ? (
          <View style={styles.depletedBadge}>
            <Text style={styles.depletedText}>Epuisee</Text>
          </View>
        ) : (
          <View style={[styles.availableDot, { backgroundColor: colors.success }]} />
        )}
      </View>
    </GCardFrame>
  </Animated.View>
</View>
```

- [ ] **Step 2: Add action buttons section below cards**

Insert a new `{/* Action buttons */}` section between the potion cards and `{/* Bottom actions */}`:

```tsx
{/* Action buttons */}
<View style={styles.actionButtons}>
  {/* Life action */}
  {lifeAvailable && !!werewolfTarget && (
    <Pressable
      style={[styles.actionBtn, heal && styles.actionBtnLifeActive]}
      onPress={() => handleHeal(!heal)}
    >
      <Text style={[styles.actionBtnText, heal && styles.actionBtnLifeActiveText]}>
        Sauver la cible
      </Text>
      {heal && <Text style={styles.undoHintLife}>Appuyer pour annuler</Text>}
    </Pressable>
  )}

  {/* Death action */}
  {deathAvailable && (
    killTargetId ? (
      <Pressable
        style={[styles.actionBtn, styles.actionBtnDeathActive]}
        onPress={handleClearTarget}
      >
        <Text style={styles.actionBtnDeathActiveText}>
          Tuer {selectedVictimName}
        </Text>
        <Text style={styles.undoHintPoison}>Appuyer pour annuler</Text>
      </Pressable>
    ) : (
      <Pressable
        style={styles.actionBtn}
        onPress={handleShowTargets}
      >
        <Text style={styles.actionBtnText}>Empoisonner</Text>
      </Pressable>
    )
  )}
</View>
```

- [ ] **Step 3: Update styles**

Replace the styles block with the updated stylesheet. Key changes:
- Remove: `potionCardInner`, `potionHint`, `potionAction`, `potionActionText`, `potionActionLife`, `potionActionLifeText`, `potionActionPoison`, `potionActionPoisonText`
- Add: `potionCard`, `potionCardLifeActive`, `potionCardDeathActive`, `availableDot`, `actionButtons`, `actionBtn`, `actionBtnLifeActive`, `actionBtnLifeActiveText`, `actionBtnDeathActive`, `actionBtnDeathActiveText`

```tsx
// --- Potion status cards ---
potionCard: {
  alignItems: "center",
},
potionContent: {
  alignItems: "center",
  justifyContent: "center",
},
potionCardLife: {
  backgroundColor: "rgba(90,30,30,0.45)",
  borderColor: "rgba(233,69,96,0.4)",
},
potionCardDeath: {
  backgroundColor: "rgba(30,70,30,0.45)",
  borderColor: "rgba(78,204,163,0.4)",
},
potionCardLifeActive: {
  borderColor: colors.danger,
  shadowColor: colors.danger,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 8,
},
potionCardDeathActive: {
  borderColor: colors.success,
  shadowColor: colors.success,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 8,
},
potionCardDepleted: {
  opacity: 0.4,
  backgroundColor: "rgba(30,30,50,0.5)",
  borderColor: "rgba(100,100,100,0.2)",
},
availableDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},

// --- Action buttons (full-width) ---
actionButtons: {
  gap: 8,
  marginBottom: 16,
},
actionBtn: {
  backgroundColor: "rgba(255,255,255,0.12)",
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: radii.base,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.2)",
  alignItems: "center",
  justifyContent: "center",
},
actionBtnText: {
  fontFamily: fonts.bodySemiBold,
  color: colors.white,
  fontSize: 15,
  fontWeight: "600",
  textAlign: "center",
  textShadowColor: "rgba(0,0,0,0.8)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
},
actionBtnLifeActive: {
  backgroundColor: "rgba(233,69,96,0.3)",
  borderWidth: 1.5,
  borderColor: colors.danger,
},
actionBtnLifeActiveText: {
  color: colors.danger,
  fontWeight: "bold",
},
actionBtnDeathActive: {
  backgroundColor: "rgba(78,204,163,0.3)",
  borderWidth: 1.5,
  borderColor: colors.success,
},
actionBtnDeathActiveText: {
  fontFamily: fonts.bodySemiBold,
  color: colors.success,
  fontSize: 15,
  fontWeight: "bold",
  textAlign: "center",
  textShadowColor: "rgba(0,0,0,0.6)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
},
undoHintLife: {
  color: "rgba(233,69,96,0.7)",
  fontSize: 11,
  marginTop: 3,
  textAlign: "center",
},
undoHintPoison: {
  color: "rgba(78,204,163,0.7)",
  fontSize: 11,
  marginTop: 3,
  textAlign: "center",
},
```

- [ ] **Step 4: Verify type-check passes**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Visual check in dev tools**

Run: `npx expo start`
Open dev tools, navigate to "Nuit: Sorcière" preview. Verify:
- Two potion cards same height, corners properly positioned
- Action buttons full-width below cards
- Tap "Sauver la cible" → card glows, button turns danger-colored
- Tap "Empoisonner" → modal opens, select target → card glows, button turns success-colored with "Tuer {name}"

- [ ] **Step 6: Commit**

```bash
git add components/online/WitchActionView.tsx
git commit -m "refactor: redesign witch night UX with separated status cards and action buttons"
```
