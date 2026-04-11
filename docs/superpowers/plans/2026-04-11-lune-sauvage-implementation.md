# Lune Sauvage Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Lune Sauvage" design system (theme + reusable G-components) for Garouf, and build a complete HTML showcase of all 24 online game screens.

**Architecture:** Theme tokens (colors, typography, spacing) in `theme/`, reusable components with `G` prefix in `components/`. The showcase is a standalone HTML file at the project root referencing real assets. Components are React Native with Expo, no external UI library.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript, Playfair Display + Outfit fonts (expo-google-fonts), existing Cinzel kept for backward compat.

---

## File Structure

### Theme (modify existing)
- `theme/colors.ts` — replace palette with Lune Sauvage tokens
- `theme/typography.ts` — replace fonts/typography with Playfair Display + Outfit
- `theme/spacing.ts` — **create** spacing + radii constants

### Fonts (modify)
- `app/_layout.tsx` — load Playfair Display + Outfit alongside Cinzel

### Components (create)
- `components/GButton.tsx`
- `components/GCardFrame.tsx`
- `components/GInput.tsx`
- `components/GPlayerRow.tsx`
- `components/GBadge.tsx`
- `components/GTimer.tsx`
- `components/GScreenBg.tsx`
- `components/GRoleCard.tsx`
- `components/GRoleCardGrid.tsx`
- `components/GModal.tsx`
- `components/GPotionCard.tsx`

### Showcase (modify)
- `design-showcase.html` — complete rewrite with all 24 screens

---

## Task 1: Install fonts and update color tokens

**Files:**
- Modify: `theme/colors.ts`
- Modify: `package.json` (via npx expo install)

- [ ] **Step 1: Install Playfair Display and Outfit font packages**

Run:
```bash
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/outfit
```

Expected: packages added to package.json dependencies.

- [ ] **Step 2: Replace theme/colors.ts with Lune Sauvage palette**

Replace the entire contents of `theme/colors.ts` with:

```ts
export const colors = {
  // Backgrounds
  background: "#0a0e16",
  surface: "rgba(126,184,218,0.04)",
  surfaceBorder: "rgba(126,184,218,0.1)",

  // Accent — bleu lunaire
  accent: "#7eb8da",
  accentBright: "#a8d8f0",
  accentDim: "rgba(126,184,218,0.25)",

  // Warm — ambre
  warm: "#e8a849",
  warmDim: "rgba(232,168,73,0.25)",

  // Text
  text: "#e4e8f0",
  textSecondary: "#8a94a8",
  textMuted: "#4a5268",

  // Semantic
  danger: "#e85d5d",
  success: "#5dd9a6",

  // Glass panels — for readable text over any background
  glass: "rgba(8,12,20,0.86)",
  glassBorder: "rgba(126,184,218,0.1)",

  // Utilities
  white: "#fff",
  black: "#000",
  overlay: "rgba(0,0,0,0.7)",

  // Legacy aliases — keep existing screens working during migration
  primary: "#7eb8da",
  primaryLight: "#a8d8f0",
  goldDark: "#e8a849",
  wolfBlue: "#3A5F8A",
  ember: "#e8a849",
  surfaceLight: "rgba(126,184,218,0.08)",
  warning: "#e8a849",
} as const;
```

Note: Legacy aliases (`primary`, `primaryLight`, `goldDark`, `wolfBlue`, `ember`, `surfaceLight`, `warning`) map old names to new Lune Sauvage values. This keeps existing screens working without a big-bang refactor. They can be removed screen-by-screen as each screen migrates to the new G-components.

- [ ] **Step 3: Verify type check passes**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors (legacy aliases ensure backward compat).

- [ ] **Step 4: Run existing tests to ensure nothing breaks**

Run:
```bash
npx jest
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add theme/colors.ts package.json package-lock.json
git commit -m "feat: update color palette to Lune Sauvage design system"
```

---

## Task 2: Update typography and create spacing tokens

**Files:**
- Modify: `theme/typography.ts`
- Create: `theme/spacing.ts`

- [ ] **Step 1: Replace theme/typography.ts**

Replace entire contents with:

```ts
import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  // Playfair Display — titles, headings
  displayBold: "PlayfairDisplay_700Bold",
  displayRegular: "PlayfairDisplay_400Regular",

  // Outfit — body text, UI elements
  bodyRegular: "Outfit_400Regular",
  bodyMedium: "Outfit_500Medium",
  bodySemiBold: "Outfit_600SemiBold",
  bodyBold: "Outfit_700Bold",

  // Legacy — keep Cinzel for role cards and existing screens during migration
  cinzelRegular: "Cinzel_400Regular",
  cinzelBold: "Cinzel_700Bold",
} as const;

export const typography: Record<string, TextStyle> = {
  // Playfair Display Bold 24px — screen titles
  heading: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
  },
  // Playfair Display Regular 20px — subtitles, phase names
  subheading: {
    fontFamily: fonts.displayRegular,
    fontSize: 20,
    color: colors.text,
  },
  // Outfit Regular 16px — body text
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.text,
  },
  // Outfit Regular 14px — secondary info
  bodySecondary: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Outfit SemiBold 12px uppercase — labels, captions
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  // Playfair Display Bold 48px — timers
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 48,
    color: colors.text,
  },
};
```

- [ ] **Step 2: Create theme/spacing.ts**

Create new file `theme/spacing.ts`:

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 4,
  base: 6,
  lg: 10,
  pill: 100,
} as const;
```

- [ ] **Step 3: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run tests**

Run: `npx jest`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add theme/typography.ts theme/spacing.ts
git commit -m "feat: add Playfair+Outfit typography and spacing tokens"
```

---

## Task 3: Load new fonts in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update _layout.tsx to load all three font families**

Replace the import and useFonts section. The full file becomes:

```tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { GameProvider } from "../context/GameContext";
import { MusicProvider } from "../context/MusicContext";
import { colors } from "../theme/colors";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "splash",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GameProvider>
      <MusicProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.accent,
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="online" options={{ headerShown: false }} />
          <Stack.Screen name="dev" options={{ headerShown: false }} />
        </Stack>
      </MusicProvider>
    </GameProvider>
  );
}
```

Key changes: added PlayfairDisplay + Outfit imports and useFonts entries, changed `headerTintColor` from `colors.primary` to `colors.accent`.

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load Playfair Display and Outfit fonts in root layout"
```

---

## Task 4: GButton component

**Files:**
- Create: `components/GButton.tsx`

- [ ] **Step 1: Create GButton component**

Create `components/GButton.tsx`:

```tsx
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii } from "../theme/spacing";

type Variant = "primary" | "outline" | "ghost" | "danger" | "warm";

interface GButtonProps {
  children: string;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle; loaderColor: string }> = {
  primary: {
    container: { backgroundColor: colors.accent },
    text: { color: colors.background },
    loaderColor: colors.background,
  },
  outline: {
    container: { backgroundColor: "rgba(8,12,20,0.5)", borderWidth: 1, borderColor: colors.accentDim },
    text: { color: colors.accent },
    loaderColor: colors.accent,
  },
  ghost: {
    container: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
    text: { color: colors.text },
    loaderColor: colors.text,
  },
  danger: {
    container: { backgroundColor: "rgba(8,12,20,0.5)", borderWidth: 1, borderColor: "rgba(232,93,93,0.2)" },
    text: { color: colors.danger },
    loaderColor: colors.danger,
  },
  warm: {
    container: { backgroundColor: colors.warm },
    text: { color: colors.background },
    loaderColor: colors.background,
  },
};

export default function GButton({ children, variant = "primary", disabled, loading, onPress, style }: GButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      style={[styles.base, v.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={v.loaderColor} />
      ) : (
        <Text style={[styles.text, v.text]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radii.base,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.4,
  },
});
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GButton.tsx
git commit -m "feat: add GButton component with 5 variants"
```

---

## Task 5: GCardFrame component

**Files:**
- Create: `components/GCardFrame.tsx`

- [ ] **Step 1: Create GCardFrame component**

Create `components/GCardFrame.tsx`:

```tsx
import { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

type Variant = "solid" | "glass";

interface GCardFrameProps {
  children: ReactNode;
  variant?: Variant;
  corners?: boolean;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
}

function CornerAccent({ position }: { position: "topLeft" | "bottomRight" }) {
  const isTop = position === "topLeft";
  return (
    <View
      style={[
        styles.corner,
        isTop
          ? { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 }
          : { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
      ]}
    />
  );
}

export default function GCardFrame({
  children,
  variant = "solid",
  corners = true,
  title,
  subtitle,
  style,
}: GCardFrameProps) {
  const isGlass = variant === "glass";

  return (
    <View
      style={[
        styles.card,
        isGlass ? styles.glass : styles.solid,
        style,
      ]}
    >
      {corners && <CornerAccent position="topLeft" />}
      {corners && <CornerAccent position="bottomRight" />}

      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.separator} />
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.base,
    padding: spacing.lg,
    borderWidth: 1,
    position: "relative",
  },
  solid: {
    backgroundColor: colors.background,
    borderColor: colors.surfaceBorder,
  },
  glass: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: colors.accent,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.15,
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
});
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GCardFrame.tsx
git commit -m "feat: add GCardFrame component with solid/glass variants and corner accents"
```

---

## Task 6: GInput component

**Files:**
- Create: `components/GInput.tsx`

- [ ] **Step 1: Create GInput component**

Create `components/GInput.tsx`:

```tsx
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

interface GInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
}

export default function GInput({ label, error, ...inputProps }: GInputProps) {
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, hasError && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {hasError && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: 14,
    fontSize: 16,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  inputError: {
    borderColor: "rgba(232,93,93,0.5)",
  },
  error: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GInput.tsx
git commit -m "feat: add GInput component with label and error states"
```

---

## Task 7: GBadge and GPlayerRow components

**Files:**
- Create: `components/GBadge.tsx`
- Create: `components/GPlayerRow.tsx`

- [ ] **Step 1: Create GBadge component**

Create `components/GBadge.tsx`:

```tsx
import { Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii } from "../theme/spacing";

type BadgeVariant = "host" | "alive" | "dead" | "wolf" | "raven" | "spectator";

interface GBadgeProps {
  text: string;
  variant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  host: {
    container: { backgroundColor: "rgba(232,168,73,0.08)" },
    text: { color: colors.warm },
  },
  alive: {
    container: { backgroundColor: "rgba(93,217,166,0.08)" },
    text: { color: colors.success },
  },
  dead: {
    container: { backgroundColor: "rgba(232,93,93,0.08)" },
    text: { color: colors.danger },
  },
  wolf: {
    container: { backgroundColor: "rgba(232,93,93,0.08)" },
    text: { color: colors.danger },
  },
  raven: {
    container: { backgroundColor: "rgba(192,132,252,0.08)" },
    text: { color: "#c084fc" },
  },
  spectator: {
    container: { backgroundColor: "rgba(255,255,255,0.06)" },
    text: { color: colors.textSecondary },
  },
};

export default function GBadge({ text, variant }: GBadgeProps) {
  const v = variantStyles[variant];
  return (
    <Text style={[styles.badge, v.container, v.text]}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
});
```

- [ ] **Step 2: Create GPlayerRow component**

Create `components/GPlayerRow.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";
import GBadge from "./GBadge";

type BadgeVariant = "host" | "alive" | "dead" | "wolf" | "raven" | "spectator";

interface GPlayerRowProps {
  name: string;
  avatarLetter: string;
  badge?: { text: string; variant: BadgeVariant };
  highlighted?: boolean;
  eliminated?: boolean;
}

export default function GPlayerRow({ name, avatarLetter, badge, highlighted, eliminated }: GPlayerRowProps) {
  return (
    <View style={[styles.row, highlighted && styles.highlighted, eliminated && styles.eliminated]}>
      <View style={[styles.avatar, highlighted && styles.avatarHighlighted]}>
        <Text style={[styles.avatarText, highlighted && styles.avatarTextHighlighted]}>
          {avatarLetter}
        </Text>
      </View>
      <Text style={[styles.name, eliminated && styles.nameEliminated]}>{name}</Text>
      {badge && <GBadge text={badge.text} variant={badge.variant} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: spacing.md,
    marginBottom: 5,
  },
  highlighted: {
    borderColor: colors.accentDim,
  },
  eliminated: {
    opacity: 0.5,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHighlighted: {
    backgroundColor: "rgba(126,184,218,0.12)",
  },
  avatarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.accent,
  },
  avatarTextHighlighted: {
    color: colors.accent,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  nameEliminated: {
    textDecorationLine: "line-through",
  },
});
```

- [ ] **Step 3: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/GBadge.tsx components/GPlayerRow.tsx
git commit -m "feat: add GBadge and GPlayerRow components"
```

---

## Task 8: GTimer component

**Files:**
- Create: `components/GTimer.tsx`

- [ ] **Step 1: Create GTimer component**

Create `components/GTimer.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { Text, Animated, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

interface GTimerProps {
  seconds: number;
  onExpire?: () => void;
  urgentThreshold?: number;
}

export default function GTimer({ seconds, onExpire, urgentThreshold = 5 }: GTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [seconds]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [seconds]);

  // Pulse animation when urgent
  useEffect(() => {
    if (remaining <= urgentThreshold && remaining > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [remaining <= urgentThreshold]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${minutes}:${secs.toString().padStart(2, "0")}`;
  const isUrgent = remaining <= urgentThreshold && remaining > 0;

  return (
    <Animated.Text
      style={[
        styles.timer,
        isUrgent && styles.urgent,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      {display}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 48,
    color: colors.text,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  urgent: {
    color: colors.danger,
  },
});
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GTimer.tsx
git commit -m "feat: add GTimer component with urgent pulse animation"
```

---

## Task 9: GScreenBg component

**Files:**
- Create: `components/GScreenBg.tsx`

- [ ] **Step 1: Create GScreenBg component**

Create `components/GScreenBg.tsx`:

```tsx
import { ReactNode } from "react";
import { View, ImageBackground, ImageSourcePropType, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface GScreenBgProps {
  source: ImageSourcePropType;
  children: ReactNode;
  overlayOpacity?: [number, number, number]; // [top, middle, bottom] gradient stops
  padHorizontal?: boolean;
}

export default function GScreenBg({
  source,
  children,
  overlayOpacity = [0.3, 0.15, 0.5],
  padHorizontal = true,
}: GScreenBgProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={source} style={styles.bg} resizeMode="cover">
      <View
        style={[
          styles.overlay,
          {
            // Simplified: use strongest opacity value as uniform overlay
            // LinearGradient would require expo-linear-gradient; this is sufficient
            backgroundColor: `rgba(10,14,22,${Math.max(...overlayOpacity)})`,
          },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.base,
            paddingBottom: insets.bottom + spacing.base,
            paddingHorizontal: padHorizontal ? spacing.lg : 0,
          },
        ]}
      >
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
});
```

Note: Uses a uniform semi-transparent overlay instead of `LinearGradient` to avoid adding `expo-linear-gradient` as a dependency. The overlay opacity is the max of the three gradient stops, which provides sufficient readability. A future enhancement could add expo-linear-gradient for more refined gradients.

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GScreenBg.tsx
git commit -m "feat: add GScreenBg component for background images with overlay"
```

---

## Task 10: GRoleCard and GRoleCardGrid components

**Files:**
- Create: `components/GRoleCard.tsx`
- Create: `components/GRoleCardGrid.tsx`

- [ ] **Step 1: Create GRoleCard component**

Create `components/GRoleCard.tsx`:

```tsx
import { View, Text, Image, Pressable, ImageSourcePropType, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

interface GRoleCardProps {
  image: ImageSourcePropType;
  name: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function GRoleCard({ image, name, count, onIncrement, onDecrement }: GRoleCardProps) {
  const active = count > 0;

  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <Image source={image} style={styles.image} resizeMode="cover" />
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <View style={styles.counter}>
        <Pressable style={styles.counterBtn} onPress={onDecrement}>
          <Text style={styles.counterBtnText}>-</Text>
        </Pressable>
        <Text style={[styles.counterVal, !active && styles.counterValZero]}>
          {count}
        </Text>
        <Pressable style={styles.counterBtn} onPress={onIncrement}>
          <Text style={styles.counterBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.base,
    padding: 6,
    paddingBottom: spacing.sm,
  },
  cardActive: {
    borderColor: colors.accent,
  },
  image: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 13,
    marginBottom: spacing.sm,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterBtn: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 17,
  },
  counterVal: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    minWidth: 14,
    textAlign: "center",
  },
  counterValZero: {
    color: colors.textMuted,
  },
});
```

- [ ] **Step 2: Create GRoleCardGrid component**

Create `components/GRoleCardGrid.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";
import { ROLE_REGISTRY, type Role } from "../game/roles";
import { ROLE_CARDS } from "../theme/roleCards";
import GRoleCard from "./GRoleCard";

const BACK_CARD = require("../assets/cards/back-card.png");

interface GRoleCardGridProps {
  roleConfig: Record<Role, number>;
  totalPlayers: number;
  onAdjust: (role: Role, delta: number) => void;
  onPreset?: () => void;
}

const ROLE_ORDER: Role[] = [
  "werewolf", "seer", "witch", "hunter", "villager",
  "cupid", "savior", "little_girl", "elder", "raven", "village_idiot",
];

export default function GRoleCardGrid({ roleConfig, totalPlayers, onAdjust, onPreset }: GRoleCardGridProps) {
  const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0);
  const isMismatch = totalRoles !== totalPlayers && totalPlayers > 0;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Roles</Text>
        <Text style={[styles.counter, isMismatch && styles.counterMismatch]}>
          {totalRoles} / {totalPlayers}
        </Text>
      </View>

      {isMismatch && (
        <Text style={styles.warning}>
          Ajuste les roles pour correspondre aux {totalPlayers} joueurs
        </Text>
      )}

      {onPreset && (
        <Pressable style={styles.presetBtn} onPress={onPreset}>
          <Text style={styles.presetBtnText}>Preset auto</Text>
        </Pressable>
      )}

      <View style={styles.grid}>
        {ROLE_ORDER.map((role) => {
          const def = ROLE_REGISTRY[role];
          const image = ROLE_CARDS[role] || BACK_CARD;
          return (
            <GRoleCard
              key={role}
              image={image}
              name={def.label}
              count={roleConfig[role]}
              onIncrement={() => onAdjust(role, 1)}
              onDecrement={() => onAdjust(role, -1)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  counter: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.accent,
  },
  counterMismatch: {
    color: colors.warm,
  },
  warning: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.warm,
    marginBottom: spacing.sm,
  },
  presetBtn: {
    backgroundColor: "rgba(126,184,218,0.06)",
    borderWidth: 1,
    borderColor: "rgba(126,184,218,0.15)",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  presetBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
```

Note: The grid uses `flexDirection: "row"` + `flexWrap: "wrap"` with gap. Each GRoleCard should be given a width of roughly `(containerWidth - 2*gap) / 3`. Since we don't have container queries in RN, the cards will naturally wrap. If we want exactly 3 columns, the parent screen can set a `width` on each card item. For now, the flex-wrap approach works well with the default card sizing.

- [ ] **Step 3: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/GRoleCard.tsx components/GRoleCardGrid.tsx
git commit -m "feat: add GRoleCard and GRoleCardGrid components"
```

---

## Task 11: GModal component

**Files:**
- Create: `components/GModal.tsx`

- [ ] **Step 1: Create GModal component**

Create `components/GModal.tsx`:

```tsx
import { ReactNode } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface GModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function GModal({ visible, onClose, title, children }: GModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Corner accents */}
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />

        {title && <Text style={styles.title}>{title}</Text>}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 2,
    borderColor: colors.accent,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "60%",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: colors.accent,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 16,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.base,
  },
});
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GModal.tsx
git commit -m "feat: add GModal bottom-sheet component with corner accents"
```

---

## Task 12: GPotionCard component

**Files:**
- Create: `components/GPotionCard.tsx`

- [ ] **Step 1: Create GPotionCard component**

Create `components/GPotionCard.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, Animated, Easing, ImageSourcePropType, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { radii, spacing } from "../theme/spacing";

type PotionVariant = "life" | "death";

interface GPotionCardProps {
  image: ImageSourcePropType;
  title: string;
  variant: PotionVariant;
  available: boolean;
  active: boolean;
  activeLabel?: string;
  onPress: () => void;
  actionLabel: string;
}

const variantColors: Record<PotionVariant, { bg: string; border: string; activeBg: string; activeText: string }> = {
  life: {
    bg: "rgba(232,93,93,0.08)",
    border: "rgba(232,93,93,0.25)",
    activeBg: "rgba(232,93,93,0.2)",
    activeText: colors.danger,
  },
  death: {
    bg: "rgba(93,217,166,0.08)",
    border: "rgba(93,217,166,0.25)",
    activeBg: "rgba(93,217,166,0.2)",
    activeText: colors.success,
  },
};

export default function GPotionCard({
  image,
  title,
  variant,
  available,
  active,
  activeLabel,
  onPress,
  actionLabel,
}: GPotionCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const vc = variantColors[variant];

  useEffect(() => {
    if (available && !active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [available, active]);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: vc.bg, borderColor: vc.border },
        !available && styles.depleted,
        available && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Image source={image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>

      {!available ? (
        <View style={styles.depletedBadge}>
          <Text style={styles.depletedText}>Epuisee</Text>
        </View>
      ) : active ? (
        <Pressable
          style={[styles.actionBtn, { backgroundColor: vc.activeBg, borderColor: vc.activeText, borderWidth: 1.5 }]}
          onPress={onPress}
        >
          <Text style={[styles.actionBtnText, { color: vc.activeText }]}>
            {activeLabel || actionLabel}
          </Text>
          <Text style={[styles.undoHint, { color: vc.activeText }]}>Appuyer pour annuler</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.actionBtn} onPress={onPress}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.base,
    borderWidth: 1,
    padding: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  depleted: {
    opacity: 0.4,
  },
  image: {
    width: 64,
    height: 80,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.white,
    marginBottom: spacing.md,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.base,
    width: "100%",
    alignItems: "center",
    minHeight: 42,
    justifyContent: "center",
  },
  actionBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
    textAlign: "center",
  },
  undoHint: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
    opacity: 0.7,
  },
  depletedBadge: {
    backgroundColor: "rgba(100,100,100,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  depletedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
});
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/GPotionCard.tsx
git commit -m "feat: add GPotionCard component with pulse animation"
```

---

## Task 13: Update dev.tsx with new component previews

**Files:**
- Modify: `app/dev.tsx`

- [ ] **Step 1: Add preview entries for all new G components in the PREVIEWS array**

Read the current `app/dev.tsx` and add entries to the `PREVIEWS` array for: `GButton` (all 5 variants), `GCardFrame` (solid + glass), `GInput` (normal + error), `GBadge` (all variants), `GPlayerRow` (normal + highlighted + eliminated), `GTimer`, `GRoleCard`. Use realistic mock props matching the game context.

This step requires reading `app/dev.tsx` first to understand the existing PREVIEWS structure, then adding entries. The exact code depends on the current structure of dev.tsx.

- [ ] **Step 2: Verify the app runs and dev tools page shows all previews**

Run: `npx expo start --ios` and navigate to Dev Tools.

- [ ] **Step 3: Commit**

```bash
git add app/dev.tsx
git commit -m "feat: add G-component previews to dev tools catalog"
```

---

## Task 14: Showcase HTML — Pre-game and Distribution screens

**Files:**
- Modify: `design-showcase.html`

- [ ] **Step 1: Add Join Game screen**

Add a phone mockup for the "Rejoindre une partie" screen with:
- Background: fond uni `#0a0e16`
- Title "Rejoindre une partie" in Playfair Display
- Input for game code (6 chars, uppercase, letter-spaced)
- Input for pseudo
- GButton primary "Rejoindre"

- [ ] **Step 2: Add Distribution — card face down**

Add phone mockup with:
- Background: `devoilement-background.png` (wood texture)
- Back-card image centered (use `assets/cards/back-card.png`)
- Hint text "Appuyez sur la carte" below
- Glass overlay for readability

- [ ] **Step 3: Add Distribution — card revealed**

Add phone mockup with:
- Background: `devoilement-background.png`
- Role card visible (use `assets/cards/voyante-card.png`)
- Role name "Voyante" in Playfair Display below
- Hint "Maintiens la carte pour voir ton pouvoir" in muted text
- GButton ghost "Pret" + counter "4/6 joueurs prets"

- [ ] **Step 4: Commit**

```bash
git add design-showcase.html
git commit -m "feat: add pre-game and distribution screens to showcase"
```

---

## Task 15: Showcase HTML — Night phase screens

**Files:**
- Modify: `design-showcase.html`

- [ ] **Step 1: Add Night Transition screen**

Phone mockup with:
- Background: `night-transition-background.png`, strong overlay (0.5)
- Centered text "La nuit tombe..." in Playfair Display
- Subtitle "Tout le monde ferme les yeux" in Outfit secondary
- Inside a GCardFrame glass with corners

- [ ] **Step 2: Add Night Wait screen**

Phone mockup with:
- Background: fond uni `#0a0e16`
- Text "La Voyante ouvre les yeux..." in Playfair Display
- CSS spinner (border animation) centered below
- Muted text "En attente..."

- [ ] **Step 3: Add Night Action (Voyante/Salvateur) screen**

Phone mockup with:
- Background: `night-transition-background.png`, medium overlay
- Phase label "Nuit 2" in label style
- Title "La Voyante" in Playfair Display
- Instruction "Choisis un joueur a inspecter"
- Timer "0:15" in accent color
- Player list as glass vote options (same style as existing night screen)
- GButton primary "Confirmer" at bottom

- [ ] **Step 4: Add Wolf Vote screen**

Phone mockup with:
- Background: `night-transition-background.png`, medium overlay
- Title "Les Loups-Garous"
- Instruction "Choisissez votre victime"
- Timer
- Player list with wolf emoji vote indicators (e.g. "Thomas 🐺🐺")
- Selected state: danger border highlight

- [ ] **Step 5: Add Witch Action screen**

Phone mockup with:
- Background: `night-transition-background.png`, medium overlay
- Title "La Sorciere"
- Timer
- Victim banner: glass panel with skull + "Victime des loups" + "Thomas" in danger color
- Two potion cards side by side:
  - Life: red tint, health-potion.png, "Vie", button "Sauver la cible"
  - Death: green tint, poison-potion.png, "Mort", button "Empoisonner"
- Bottom: GButton primary "Confirmer" / ghost "Ne rien faire"

- [ ] **Step 6: Add Little Girl screen**

Phone mockup with:
- Background: `night-transition-background.png`, strong overlay
- Title "La Petite Fille"
- Instruction "Tu apercois des silhouettes dans la nuit..."
- Timer
- Glass panel listing wolf names: "Maxime", "Lucas"
- GButton ghost "Fermer les yeux"

- [ ] **Step 7: Commit**

```bash
git add design-showcase.html
git commit -m "feat: add night phase screens to showcase"
```

---

## Task 16: Showcase HTML — Day and special phase screens

**Files:**
- Modify: `design-showcase.html`

- [ ] **Step 1: Add Raven Mark screen**

Phone mockup with:
- Background: `sun-transition-background.png`, medium overlay
- Glass card with warm corner accents
- Phase "Jour 2"
- Title "Un joueur porte la marque du Corbeau"
- Player name in purple (#c084fc) large text
- Subtitle "Il commence le vote avec 2 voix contre lui"
- GButton warm "Lancer le debat"

- [ ] **Step 2: Add Hunter screen**

Phone mockup with:
- Background: `sunset-background.png`, medium overlay
- Glass card
- Title "Tu es le Chasseur !"
- Instruction "Tu as ete elimine. Choisis un joueur a emporter avec toi."
- Timer (danger color, 15s)
- Player list as vote options
- GButton danger "Tirer"

- [ ] **Step 3: Add Spectator screen**

Phone mockup with:
- Background: fond uni `#0a0e16`
- Large skull emoji (64px) centered
- "Tu es elimine(e)" in Playfair Display, textSecondary color
- Current phase info "Nuit en cours — seer" in textMuted
- No action buttons

- [ ] **Step 4: Add End — Wolves Win screen**

Phone mockup with:
- Background: `night-transition-background.png`, strong overlay
- Glass card with danger-colored corners
- Title "Fin de la partie" in Playfair Display
- Message "Les Loups-Garous ont devore le village !" in danger color, large
- Wolf emoji
- GButton primary "Retour a l'accueil"

- [ ] **Step 5: Add End — Village Wins screen**

Phone mockup with:
- Background: `sun-transition-background.png`, medium overlay
- Glass card with success-colored corners
- Title "Fin de la partie"
- Message "Le village a triomphe des loups !" in success color, large
- GButton primary "Retour a l'accueil"

- [ ] **Step 6: Add Paused screen**

Phone mockup with:
- Background: fond uni `#0a0e16`
- Glass card with warm corners
- Title "Partie en pause"
- "Thomas s'est deconnecte" in warm color
- Timer countdown "Reprise dans 45s..."
- Spinner

- [ ] **Step 7: Commit**

```bash
git add design-showcase.html
git commit -m "feat: add day, hunter, spectator, end, and paused screens to showcase"
```

---

## Task 17: Final verification

- [ ] **Step 1: Type check all files**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Run all tests**

Run: `npx jest`
Expected: all pass.

- [ ] **Step 3: Open showcase in browser and verify all 24 screens render correctly**

Run: `open design-showcase.html`
Verify: all phone mockups show, backgrounds load, text is readable on every screen.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for Lune Sauvage design system"
```
