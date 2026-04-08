# Splash Screen & Art Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated splash screen showing the Garouf logo, and apply a medieval/card-game art direction across all screens (gold palette, Cinzel font, CardFrame component).

**Architecture:** The splash screen uses Expo's native splash + a custom animated screen (`app/splash.tsx`) with `react-native-reanimated`. The art direction is built on an updated `theme/colors.ts` palette, Cinzel font loaded in `_layout.tsx`, and a `CardFrame` wrapper component applied to all game screens.

**Tech Stack:** Expo SDK 54, React Native 0.81, expo-splash-screen, expo-font, react-native-reanimated, @expo-google-fonts/cinzel

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `assets/logo-app.png` | Rename (from `assets/ logo-app.png`) | App logo image |
| `assets/fonts/` | Create dir | Font files (downloaded by expo-google-fonts) |
| `app.json` | Modify | Splash/icon config pointing to logo |
| `theme/colors.ts` | Modify | New gold-based palette |
| `theme/typography.ts` | Create | Font family constants and text style presets |
| `app/_layout.tsx` | Modify | Load fonts, configure expo-splash-screen |
| `app/splash.tsx` | Create | Animated splash screen |
| `app/index.tsx` | Modify | Logo image replaces emoji, gold button |
| `components/CardFrame.tsx` | Create | Card-game border wrapper |
| `app/players-setup.tsx` | Modify | Wrap in CardFrame, gold palette |
| `app/roles-setup.tsx` | Modify | Wrap in CardFrame, gold palette |
| `app/distribution.tsx` | Modify | Wrap in CardFrame, gold palette |
| `app/night.tsx` | Modify | Wrap in CardFrame, gold palette |
| `app/day.tsx` | Modify | Wrap in CardFrame, gold palette |
| `app/hunter.tsx` | Modify | Wrap in CardFrame, gold palette |
| `app/end.tsx` | Modify | Wrap in CardFrame, gold palette |

---

### Task 1: Prerequisites — Rename logo file and install dependencies

**Files:**
- Rename: `assets/ logo-app.png` → `assets/logo-app.png`

- [ ] **Step 1: Rename the logo file**

```bash
cd /Users/maximecaron/Dev_perso/loup_garou
mv "assets/ logo-app.png" assets/logo-app.png
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/maximecaron/Dev_perso/loup_garou
npx expo install expo-splash-screen expo-font react-native-reanimated @expo-google-fonts/cinzel
```

`expo-splash-screen` and `react-native-reanimated` may already be in the SDK, but `expo install` will pick the compatible version. `@expo-google-fonts/cinzel` provides the font files directly (no manual download needed).

- [ ] **Step 3: Verify installation**

Run: `cat package.json | grep -E "expo-splash-screen|expo-font|reanimated|cinzel"`
Expected: all four packages appear in dependencies.

- [ ] **Step 4: Commit**

```bash
git add assets/logo-app.png package.json package-lock.json
git rm "assets/ logo-app.png" 2>/dev/null || true
git commit -m "chore: rename logo file and install font/splash dependencies"
```

---

### Task 2: Update color palette

**Files:**
- Modify: `theme/colors.ts`

- [ ] **Step 1: Update colors.ts with the new gold-based palette**

Replace the entire contents of `theme/colors.ts` with:

```ts
export const colors = {
  // Backgrounds
  background: "#1a1a2e",
  surface: "#16213e",
  surfaceLight: "#0f3460",

  // Primary — gold from logo
  primary: "#D4A017",
  primaryLight: "#E8B828",
  goldDark: "#A67C00",

  // Accent colors from logo
  wolfBlue: "#3A5F8A",
  ember: "#E87C2A",

  // Text
  text: "#eee",
  textSecondary: "#aaa",
  textMuted: "#666",

  // Semantic
  success: "#4ecca3",
  danger: "#e94560",
  warning: "#E87C2A",

  // Utilities
  white: "#fff",
  black: "#000",
  overlay: "rgba(0,0,0,0.7)",
};
```

Key change: `primary` goes from `#e94560` (red) to `#D4A017` (gold). `primaryLight` changes from `#ff6b6b` to `#E8B828`. New colors: `goldDark`, `wolfBlue`, `ember`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors (all screens reference `colors.primary` etc. which still exist)

- [ ] **Step 3: Commit**

```bash
git add theme/colors.ts
git commit -m "feat: update color palette with gold theme from logo"
```

---

### Task 3: Create typography constants

**Files:**
- Create: `theme/typography.ts`

- [ ] **Step 1: Create theme/typography.ts**

```ts
import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  cinzelRegular: "Cinzel_400Regular",
  cinzelBold: "Cinzel_700Bold",
} as const;

export const typography: Record<string, TextStyle> = {
  // Cinzel Bold 28-32px, gold — screen titles, "GAROUF"
  heading: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
  },
  // Cinzel Regular 20-22px, light — phase names, subtitles
  subheading: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 20,
    color: colors.text,
  },
  // System 16px — body text (no fontFamily = system default)
  body: {
    fontSize: 16,
    color: colors.text,
  },
  // System 14px — secondary info
  bodySecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // System 12px — labels, hints
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add theme/typography.ts
git commit -m "feat: add typography constants with Cinzel font config"
```

---

### Task 4: Update layout to load fonts and configure splash screen

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Rewrite _layout.tsx to load fonts and manage splash**

Replace the entire contents of `app/_layout.tsx` with:

```tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { GameProvider } from "../context/GameContext";
import { colors } from "../theme/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
    </GameProvider>
  );
}
```

Changes from original:
- Import and call `SplashScreen.preventAutoHideAsync()` to keep native splash visible
- Load Cinzel fonts via `useFonts` hook
- Hide splash once fonts are loaded
- Return `null` while fonts load (native splash stays visible)
- `headerTintColor` changed from `colors.text` to `colors.primary` (gold)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load Cinzel fonts and configure splash screen in layout"
```

---

### Task 5: Create animated splash screen

**Files:**
- Create: `app/splash.tsx`

- [ ] **Step 1: Create app/splash.tsx**

```tsx
import { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.65;
const ANIMATION_DURATION = 800;
const HOLD_DURATION = 700;

export default function SplashAnimationScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  const navigateHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(
      1,
      {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      },
      () => {
        // After animation completes, wait then navigate
        runOnJS(setTimeout)(() => runOnJS(navigateHome)(), HOLD_DURATION);
      }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require("../assets/logo-app.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors (may need to check if `require` works for images — standard in RN)

- [ ] **Step 3: Commit**

```bash
git add app/splash.tsx
git commit -m "feat: add animated splash screen with logo fade-in and scale"
```

---

### Task 6: Update app.json and configure initial route

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Update app.json**

Replace the entire contents of `app.json` with:

```json
{
  "expo": {
    "name": "Garouf",
    "slug": "garouf",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/logo-app.png",
    "userInterfaceStyle": "dark",
    "scheme": "garouf",
    "splash": {
      "image": "./assets/logo-app.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/logo-app.png",
        "backgroundColor": "#1a1a2e"
      }
    },
    "plugins": [
      "expo-router",
      "expo-font"
    ]
  }
}
```

Changes: `icon` → `./assets/logo-app.png`, `splash.image` → `./assets/logo-app.png`, `android.adaptiveIcon.foregroundImage` → `./assets/logo-app.png`, added `expo-font` plugin.

- [ ] **Step 2: Update _layout.tsx to set splash as initial route**

In `app/_layout.tsx`, update the `Stack` component to set `splash` as the initial route:

```tsx
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
```

Also update the default export so the app starts on the splash screen. In `app/_layout.tsx`, add the `unstable_settings` export before the component:

```tsx
export const unstable_settings = {
  initialRouteName: "splash",
};
```

Place this line right after the `SplashScreen.preventAutoHideAsync()` call.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app.json app/_layout.tsx
git commit -m "feat: configure app.json with logo and set splash as initial route"
```

---

### Task 7: Update Home screen with logo

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Update index.tsx to show logo image and use Cinzel font**

Replace the entire contents of `app/index.tsx` with:

```tsx
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.5;

export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useGame();

  const handleNewGame = () => {
    dispatch({ type: "RESET_GAME" });
    router.push("/players-setup");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo-app.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Garouf</Text>
      <Text style={styles.subtitle}>Le jeu de la pause midi</Text>
      <Pressable style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>Nouvelle partie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontFamily: fonts.cinzelBold,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
  },
});
```

Changes from original:
- Logo `Image` replaces the emoji `🐺`
- Title uses `fonts.cinzelBold` and `colors.primary` (gold)
- Button text color is `colors.black` on gold background for contrast

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: update home screen with logo image and Cinzel font"
```

---

### Task 8: Create CardFrame component

**Files:**
- Create: `components/CardFrame.tsx`

- [ ] **Step 1: Create components directory and CardFrame.tsx**

```bash
mkdir -p /Users/maximecaron/Dev_perso/loup_garou/components
```

Create `components/CardFrame.tsx`:

```tsx
import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

interface CardFrameProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

function Corner({ position }: { position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" }) {
  const positionStyles = {
    topLeft: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
    topRight: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
    bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
    bottomRight: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  } as const;

  return (
    <View
      style={[
        styles.corner,
        positionStyles[position],
      ]}
    />
  );
}

export default function CardFrame({ children, title, subtitle }: CardFrameProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Corner position="topLeft" />
        <Corner position="topRight" />
        <Corner position="bottomLeft" />
        <Corner position="bottomRight" />

        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            <View style={styles.separator} />
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.background,
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: colors.primary,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 24,
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.3,
    alignSelf: "stretch",
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/CardFrame.tsx
git commit -m "feat: add CardFrame component with gold card-game border"
```

---

### Task 9: Apply CardFrame to players-setup screen

**Files:**
- Modify: `app/players-setup.tsx`

- [ ] **Step 1: Wrap players-setup in CardFrame**

Replace the entire contents of `app/players-setup.tsx` with:

```tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import CardFrame from "../components/CardFrame";

const MIN_PLAYERS = 4;

export default function PlayersSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [name, setName] = useState("");

  const addPlayer = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    dispatch({ type: "ADD_PLAYER", name: trimmed });
    setName("");
  };

  const canProceed = state.players.length >= MIN_PLAYERS;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Joueurs" }} />
      <CardFrame title="Joueurs" subtitle="Ajoutez les participants">
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Nom du joueur"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            onSubmitEditing={addPlayer}
            autoFocus
          />
          <Pressable
            style={[styles.addButton, !name.trim() && styles.buttonDisabled]}
            onPress={addPlayer}
            disabled={!name.trim()}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.count}>
          {state.players.length} joueur{state.players.length !== 1 ? "s" : ""}{" "}
          {state.players.length < MIN_PLAYERS
            ? `(min. ${MIN_PLAYERS})`
            : ""}
        </Text>

        <FlatList
          data={state.players}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>
                {index + 1}. {item.name}
              </Text>
              <Pressable
                onPress={() =>
                  dispatch({ type: "REMOVE_PLAYER", id: item.id })
                }
              >
                <Text style={styles.removeButton}>✕</Text>
              </Pressable>
            </View>
          )}
        />

        <Pressable
          style={[styles.nextButton, !canProceed && styles.buttonDisabled]}
          onPress={() => router.push("/roles-setup")}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </Pressable>
      </CardFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    padding: 14,
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  addButtonText: {
    color: colors.black,
    fontSize: 28,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  removeButton: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: 8,
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  nextButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

Changes: Wrapped in `CardFrame`, removed `container` padding (CardFrame handles it), button text on gold uses `colors.black`, add button text uses `colors.black`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/players-setup.tsx
git commit -m "feat: apply CardFrame and gold theme to players-setup screen"
```

---

### Task 10: Apply CardFrame to roles-setup screen

**Files:**
- Modify: `app/roles-setup.tsx`

- [ ] **Step 1: Wrap roles-setup in CardFrame**

Replace the entire contents of `app/roles-setup.tsx` with:

```tsx
import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";
import CardFrame from "../components/CardFrame";

interface RoleConfig {
  role: Role;
  label: string;
  emoji: string;
  description: string;
  min: number;
  max: number;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: "werewolf",
    label: "Loup-Garou",
    emoji: "🐺",
    description: "Se reveille la nuit pour eliminer un villageois",
    min: 1,
    max: 4,
  },
  {
    role: "seer",
    label: "Voyante",
    emoji: "🔮",
    description: "Peut voir le role d'un joueur chaque nuit",
    min: 0,
    max: 1,
  },
  {
    role: "witch",
    label: "Sorciere",
    emoji: "🧪",
    description: "Potion de vie et potion de mort",
    min: 0,
    max: 1,
  },
  {
    role: "hunter",
    label: "Chasseur",
    emoji: "🏹",
    description: "Emporte un joueur en mourant",
    min: 0,
    max: 1,
  },
];

const TIMER_OPTIONS = [1, 2, 3, 4, 5];

export default function RolesSetupScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const playerCount = state.players.length;

  const [counts, setCounts] = useState<Record<Role, number>>({
    werewolf: 2,
    villager: 0,
    seer: 1,
    witch: 1,
    hunter: 1,
  });

  const specialCount = ROLE_CONFIGS.reduce(
    (sum, rc) => sum + (counts[rc.role] || 0),
    0
  );
  const villagerCount = playerCount - specialCount;
  const isValid = villagerCount >= 0 && counts.werewolf >= 1;

  const updateCount = (role: Role, delta: number) => {
    const config = ROLE_CONFIGS.find((rc) => rc.role === role)!;
    const newVal = Math.max(config.min, Math.min(config.max, counts[role] + delta));
    setCounts({ ...counts, [role]: newVal });
  };

  const handleStart = () => {
    const roles: { role: Role; count: number }[] = [
      ...ROLE_CONFIGS.map((rc) => ({ role: rc.role, count: counts[rc.role] })),
      { role: "villager" as Role, count: villagerCount },
    ];
    dispatch({ type: "SET_ROLES", roles });
    dispatch({ type: "START_DISTRIBUTION" });
    router.push("/distribution");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Roles" }} />
      <CardFrame title="Roles" subtitle={`${playerCount} joueurs`}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {ROLE_CONFIGS.map((rc) => (
            <View key={rc.role} style={styles.roleRow}>
              <View style={styles.roleInfo}>
                <Text style={styles.roleLabel}>
                  {rc.emoji} {rc.label}
                </Text>
                <Text style={styles.roleDesc}>{rc.description}</Text>
              </View>
              <View style={styles.counter}>
                <Pressable
                  onPress={() => updateCount(rc.role, -1)}
                  style={styles.counterBtn}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={styles.counterValue}>{counts[rc.role]}</Text>
                <Pressable
                  onPress={() => updateCount(rc.role, 1)}
                  style={styles.counterBtn}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View style={styles.villagerRow}>
            <Text style={styles.roleLabel}>🧑‍🌾 Villageois</Text>
            <Text
              style={[
                styles.villagerCount,
                villagerCount < 0 && styles.errorText,
              ]}
            >
              {villagerCount < 0 ? `${villagerCount} (trop de roles!)` : villagerCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.timerTitle}>Timer de debat</Text>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((min) => (
              <Pressable
                key={min}
                style={[
                  styles.timerOption,
                  state.debateTimerMinutes === min && styles.timerOptionActive,
                ]}
                onPress={() => dispatch({ type: "SET_TIMER", minutes: min })}
              >
                <Text
                  style={[
                    styles.timerOptionText,
                    state.debateTimerMinutes === min && styles.timerOptionTextActive,
                  ]}
                >
                  {min} min
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.startButton, !isValid && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={!isValid}
          >
            <Text style={styles.startButtonText}>Distribuer les roles</Text>
          </Pressable>
        </ScrollView>
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  roleInfo: {
    flex: 1,
    marginRight: 12,
  },
  roleLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  roleDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  counterBtn: {
    backgroundColor: colors.surfaceLight,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },
  counterValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  villagerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  villagerCount: {
    color: colors.success,
    fontSize: 20,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceLight,
    marginVertical: 16,
  },
  timerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  timerOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  timerOptionActive: {
    backgroundColor: colors.primary,
  },
  timerOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  timerOptionTextActive: {
    color: colors.black,
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  startButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
```

Changes: Wrapped in `CardFrame`, removed container padding, `ScrollView` instead of top-level `ScrollView`, active timer and button text use `colors.black` on gold background.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/roles-setup.tsx
git commit -m "feat: apply CardFrame and gold theme to roles-setup screen"
```

---

### Task 11: Apply CardFrame to distribution screen

**Files:**
- Modify: `app/distribution.tsx`

- [ ] **Step 1: Wrap distribution in CardFrame**

Replace the entire contents of `app/distribution.tsx` with:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const currentPlayer = state.players[state.distributionIndex];
  if (!currentPlayer) return null;

  const roleInfo = currentPlayer.role
    ? ROLE_LABELS[currentPlayer.role]
    : null;

  const handleNext = () => {
    dispatch({ type: "NEXT_PLAYER" });
    if (state.distributionIndex + 1 >= state.players.length) {
      router.replace("/night");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "Distribution", headerBackVisible: false }}
      />
      <CardFrame
        title="Distribution"
        subtitle={`${state.distributionIndex + 1} / ${state.players.length}`}
      >
        <View style={styles.centered}>
          {!state.revealedRole ? (
            <>
              <Text style={styles.instruction}>
                Passez le telephone a :
              </Text>
              <Text style={styles.playerName}>{currentPlayer.name}</Text>
              <Pressable
                style={styles.button}
                onPress={() => dispatch({ type: "REVEAL_ROLE" })}
              >
                <Text style={styles.buttonText}>Voir mon role</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.playerName}>{currentPlayer.name}</Text>
              <Text style={styles.roleEmoji}>{roleInfo?.emoji}</Text>
              <Text style={styles.roleName}>
                {roleInfo?.label}
              </Text>
              <Pressable style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>J'ai compris, suivant</Text>
              </Pressable>
            </>
          )}
        </View>
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 8,
  },
  playerName: {
    fontFamily: fonts.cinzelBold,
    color: colors.text,
    fontSize: 32,
    marginBottom: 16,
  },
  roleEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  roleName: {
    fontFamily: fonts.cinzelRegular,
    color: colors.primary,
    fontSize: 28,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

Changes: Wrapped in `CardFrame`, player name uses Cinzel Bold, role name uses Cinzel Regular, button text on gold uses `colors.black`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/distribution.tsx
git commit -m "feat: apply CardFrame and gold theme to distribution screen"
```

---

### Task 12: Apply CardFrame to night screen

**Files:**
- Modify: `app/night.tsx`

- [ ] **Step 1: Wrap night screen in CardFrame**

Replace the entire contents of `app/night.tsx` with:

```tsx
import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { useNarrator } from "../hooks/useNarrator";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

const ROLE_LABELS: Record<Role, string> = {
  werewolf: "Loup-Garou",
  villager: "Villageois",
  seer: "Voyante",
  witch: "Sorciere",
  hunter: "Chasseur",
};

export default function NightScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  useNarrator(state.nightStep);

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const aliveNonWolves = alivePlayers.filter((p) => p.role !== "werewolf");

  const handleNextStep = () => {
    dispatch({ type: "NEXT_NIGHT_STEP" });
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_NIGHT" });
  };

  useEffect(() => {
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "day") router.replace("/day");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  const nightTitle = `Nuit ${state.turn}`;

  return (
    <>
      <Stack.Screen
        options={{ title: nightTitle, headerBackVisible: false }}
      />
      <CardFrame title={nightTitle}>
        {state.nightStep === "intro" && (
          <View style={styles.centered}>
            <Text style={styles.emoji}>🌙</Text>
            <Text style={styles.title}>La nuit tombe...</Text>
            <Text style={styles.subtitle}>Tout le monde ferme les yeux</Text>
            <Pressable style={styles.button} onPress={handleNextStep}>
              <Text style={styles.buttonText}>Continuer</Text>
            </Pressable>
          </View>
        )}

        {state.nightStep === "werewolves" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>🐺 Les Loups-Garous se reveillent</Text>
            <Text style={styles.instruction}>
              Choisissez une victime :
            </Text>
            <FlatList
              data={aliveNonWolves}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.playerOption,
                    state.nightActions.werewolvesTarget === item.id &&
                      styles.playerOptionSelected,
                  ]}
                  onPress={() =>
                    dispatch({
                      type: "SET_WEREWOLF_TARGET",
                      playerId: item.id,
                    })
                  }
                >
                  <Text style={styles.playerOptionText}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable
              style={[
                styles.button,
                !state.nightActions.werewolvesTarget && styles.buttonDisabled,
              ]}
              onPress={handleNextStep}
              disabled={!state.nightActions.werewolvesTarget}
            >
              <Text style={styles.buttonText}>Confirmer</Text>
            </Pressable>
          </View>
        )}

        {state.nightStep === "seer" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>🔮 La Voyante se reveille</Text>
            <Text style={styles.instruction}>
              Choisissez un joueur a inspecter :
            </Text>
            {state.nightActions.seerTarget ? (
              <View style={styles.centered}>
                <Text style={styles.revealName}>
                  {state.players.find((p) => p.id === state.nightActions.seerTarget)?.name}
                </Text>
                <Text style={styles.revealRole}>
                  {ROLE_LABELS[
                    state.players.find(
                      (p) => p.id === state.nightActions.seerTarget
                    )?.role ?? "villager"
                  ]}
                </Text>
                <Pressable style={styles.button} onPress={handleNextStep}>
                  <Text style={styles.buttonText}>Continuer</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={alivePlayers.filter(
                  (p) => p.role !== "seer"
                )}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.playerOption}
                    onPress={() =>
                      dispatch({
                        type: "SET_SEER_TARGET",
                        playerId: item.id,
                      })
                    }
                  >
                    <Text style={styles.playerOptionText}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        )}

        {state.nightStep === "witch" && (
          <WitchStep
            state={state}
            dispatch={dispatch}
            onNext={handleNextStep}
            aliveNonWolves={aliveNonWolves}
            alivePlayers={alivePlayers}
          />
        )}

        {state.nightStep === "resolution" && (
          <View style={styles.centered}>
            <Text style={styles.emoji}>☀️</Text>
            <Text style={styles.title}>Le soleil se leve...</Text>
            <Pressable style={styles.button} onPress={handleResolve}>
              <Text style={styles.buttonText}>Reveler les evenements</Text>
            </Pressable>
          </View>
        )}
      </CardFrame>
    </>
  );
}

function WitchStep({
  state,
  dispatch,
  onNext,
  alivePlayers,
}: {
  state: ReturnType<typeof useGame>["state"];
  dispatch: ReturnType<typeof useGame>["dispatch"];
  onNext: () => void;
  aliveNonWolves: ReturnType<typeof useGame>["state"]["players"];
  alivePlayers: ReturnType<typeof useGame>["state"]["players"];
}) {
  const victim = state.players.find(
    (p) => p.id === state.nightActions.werewolvesTarget
  );
  const canHeal = state.witchPotions.life && !state.nightActions.witchHeal;
  const canKill = state.witchPotions.death && !state.nightActions.witchKill;

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.stepTitle}>🧪 La Sorciere se reveille</Text>

      {victim && (
        <Text style={styles.instruction}>
          Cette nuit, {victim.name} a ete attaque(e).
        </Text>
      )}

      {canHeal && victim && (
        <Pressable
          style={[styles.potionButton, styles.potionLife]}
          onPress={() => dispatch({ type: "SET_WITCH_HEAL", heal: true })}
        >
          <Text style={styles.buttonText}>💚 Utiliser la potion de vie</Text>
        </Pressable>
      )}

      {state.nightActions.witchHeal && (
        <Text style={styles.potionUsed}>
          ✅ Potion de vie utilisee
        </Text>
      )}

      {canKill && (
        <>
          <Text style={styles.instruction}>Empoisonner quelqu'un ?</Text>
          <FlatList
            data={alivePlayers.filter(
              (p) =>
                p.role !== "witch" &&
                p.id !== state.nightActions.werewolvesTarget
            )}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.playerOption,
                  state.nightActions.witchKill === item.id &&
                    styles.playerOptionDanger,
                ]}
                onPress={() =>
                  dispatch({
                    type: "SET_WITCH_KILL",
                    playerId:
                      state.nightActions.witchKill === item.id
                        ? null
                        : item.id,
                  })
                }
              >
                <Text style={styles.playerOptionText}>{item.name}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 48,
  },
  stepTitle: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  playerOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionSelected: {
    backgroundColor: colors.primary,
  },
  playerOptionDanger: {
    backgroundColor: colors.danger,
  },
  playerOptionText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  revealName: {
    fontFamily: fonts.cinzelBold,
    color: colors.text,
    fontSize: 28,
    marginBottom: 8,
  },
  revealRole: {
    fontFamily: fonts.cinzelRegular,
    color: colors.ember,
    fontSize: 24,
    marginBottom: 32,
  },
  potionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  potionLife: {
    backgroundColor: "#2d6a4f",
  },
  potionUsed: {
    color: colors.success,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
});
```

Changes: Wrapped in `CardFrame`, titles use Cinzel font, button text uses `colors.black`, `revealRole` uses `colors.ember` instead of `colors.warning`, removed redundant container/padding styles.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/night.tsx
git commit -m "feat: apply CardFrame and gold theme to night screen"
```

---

### Task 13: Apply CardFrame to day screen

**Files:**
- Modify: `app/day.tsx`

- [ ] **Step 1: Wrap day screen in CardFrame**

Replace the entire contents of `app/day.tsx` with:

```tsx
import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

type DayStep = "announce" | "debate" | "vote";

export default function DayScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [dayStep, setDayStep] = useState<DayStep>("announce");
  const [secondsLeft, setSecondsLeft] = useState(
    state.debateTimerMinutes * 60
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (dayStep === "debate" && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setDayStep("vote");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dayStep]);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const deadNames = state.nightDeaths
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const handleVote = (playerId: string) => {
    dispatch({ type: "VOTE_ELIMINATE", playerId });
  };

  useEffect(() => {
    if (state.phase === "hunter") router.replace("/hunter");
    else if (state.phase === "night") router.replace("/night");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const dayTitle = `Jour ${state.turn}`;

  return (
    <>
      <Stack.Screen
        options={{ title: dayTitle, headerBackVisible: false }}
      />
      <CardFrame title={dayTitle}>
        {dayStep === "announce" && (
          <View style={styles.centered}>
            <Text style={styles.emoji}>☀️</Text>
            <Text style={styles.title}>Le village se reveille</Text>
            {deadNames.length === 0 ? (
              <Text style={styles.announcement}>
                Personne n'est mort cette nuit !
              </Text>
            ) : (
              <>
                <Text style={styles.announcement}>
                  Cette nuit, le village a perdu :
                </Text>
                {deadNames.map((name) => (
                  <Text key={name} style={styles.deadName}>
                    💀 {name}
                  </Text>
                ))}
              </>
            )}
            <Pressable
              style={styles.button}
              onPress={() => setDayStep("debate")}
            >
              <Text style={styles.buttonText}>Lancer le debat</Text>
            </Pressable>
          </View>
        )}

        {dayStep === "debate" && (
          <View style={styles.centered}>
            <Text style={styles.title}>Debat en cours</Text>
            <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.subtitle}>
              Les villageois debattent...
            </Text>
            <Pressable
              style={styles.skipButton}
              onPress={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setDayStep("vote");
              }}
            >
              <Text style={styles.skipButtonText}>Passer au vote</Text>
            </Pressable>
          </View>
        )}

        {dayStep === "vote" && (
          <View style={styles.fullContainer}>
            <Text style={styles.stepTitle}>🗳️ Vote du village</Text>
            <Text style={styles.instruction}>
              Qui le village elimine-t-il ?
            </Text>
            <FlatList
              data={alivePlayers}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.playerOption}
                  onPress={() => handleVote(item.id)}
                >
                  <Text style={styles.playerOptionText}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 28,
    marginBottom: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 32,
  },
  announcement: {
    color: colors.textSecondary,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  deadName: {
    fontFamily: fonts.cinzelBold,
    color: colors.danger,
    fontSize: 24,
    marginBottom: 8,
  },
  timer: {
    fontFamily: fonts.cinzelBold,
    color: colors.ember,
    fontSize: 72,
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  playerOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerOptionText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
```

Changes: Wrapped in `CardFrame`, titles use Cinzel, timer uses `colors.ember`, dead names use Cinzel Bold, button text uses `colors.black`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/day.tsx
git commit -m "feat: apply CardFrame and gold theme to day screen"
```

---

### Task 14: Apply CardFrame to hunter screen

**Files:**
- Modify: `app/hunter.tsx`

- [ ] **Step 1: Wrap hunter screen in CardFrame**

Replace the entire contents of `app/hunter.tsx` with:

```tsx
import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

export default function HunterScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const hunter = state.players.find(
    (p) => p.role === "hunter" && !p.isAlive
  );

  const handleShoot = (playerId: string) => {
    dispatch({ type: "HUNTER_SHOOT", playerId });
  };

  useEffect(() => {
    if (state.phase === "day") router.replace("/day");
    else if (state.phase === "night") router.replace("/night");
    else if (state.phase === "end") router.replace("/end");
  }, [state.phase]);

  return (
    <>
      <Stack.Screen
        options={{ title: "Chasseur", headerBackVisible: false }}
      />
      <CardFrame title="Chasseur" subtitle={`${hunter?.name} a ete elimine`}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🏹</Text>
          <Text style={styles.title}>
            {hunter?.name} etait le Chasseur !
          </Text>
          <Text style={styles.subtitle}>
            Avant de mourir, il peut emporter quelqu'un avec lui.
          </Text>
        </View>

        <FlatList
          data={alivePlayers}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.playerOption}
              onPress={() => handleShoot(item.id)}
            >
              <Text style={styles.playerOptionText}>{item.name}</Text>
            </Pressable>
          )}
        />
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  playerOption: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerOptionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
```

Changes: Wrapped in `CardFrame`, title uses Cinzel, removed redundant container style.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/hunter.tsx
git commit -m "feat: apply CardFrame and gold theme to hunter screen"
```

---

### Task 15: Apply CardFrame to end screen

**Files:**
- Modify: `app/end.tsx`

- [ ] **Step 1: Wrap end screen in CardFrame**

Replace the entire contents of `app/end.tsx` with:

```tsx
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useGame, Role } from "../context/GameContext";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import CardFrame from "../components/CardFrame";

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorciere", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
};

export default function EndScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  const isWerewolfWin = state.winner === "werewolves";

  return (
    <>
      <Stack.Screen
        options={{ title: "Fin de partie", headerBackVisible: false }}
      />
      <CardFrame
        title={isWerewolfWin ? "Victoire des Loups" : "Victoire du Village"}
        subtitle={`Partie en ${state.turn} tour${state.turn > 1 ? "s" : ""}`}
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>{isWerewolfWin ? "🐺" : "🎉"}</Text>
          <Text style={styles.title}>
            {isWerewolfWin
              ? "Les Loups-Garous ont gagne !"
              : "Les Villageois ont gagne !"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recap des roles</Text>
        <FlatList
          data={state.players}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => {
            const roleInfo = item.role ? ROLE_LABELS[item.role] : null;
            return (
              <View
                style={[
                  styles.playerRow,
                  !item.isAlive && styles.playerDead,
                ]}
              >
                <Text style={styles.playerName}>
                  {roleInfo?.emoji} {item.name}
                </Text>
                <View style={styles.playerDetails}>
                  <Text style={styles.roleName}>{roleInfo?.label}</Text>
                  <Text
                    style={[
                      styles.status,
                      item.isAlive ? styles.alive : styles.dead,
                    ]}
                  >
                    {item.isAlive ? "Survivant" : "Mort"}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <Pressable
          style={styles.button}
          onPress={() => {
            dispatch({ type: "RESET_GAME" });
            router.replace("/");
          }}
        >
          <Text style={styles.buttonText}>Nouvelle partie</Text>
        </Pressable>
      </CardFrame>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.cinzelRegular,
    color: colors.text,
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerDead: {
    opacity: 0.5,
  },
  playerName: {
    color: colors.text,
    fontSize: 18,
  },
  playerDetails: {
    alignItems: "flex-end",
  },
  roleName: {
    color: colors.ember,
    fontSize: 14,
    fontWeight: "600",
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
  alive: {
    color: colors.success,
  },
  dead: {
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

Changes: Wrapped in `CardFrame`, titles use Cinzel, `roleName` uses `colors.ember` instead of `colors.warning`, button text on gold uses `colors.black`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/end.tsx
git commit -m "feat: apply CardFrame and gold theme to end screen"
```

---

### Task 16: Run tests and verify

**Files:** None (verification only)

- [ ] **Step 1: Run existing tests**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx jest`
Expected: all tests pass. The tests are for game logic (`gameReducer.test.ts`) and `useNarrator.test.ts` — they shouldn't be affected by visual changes.

- [ ] **Step 2: Run TypeScript check**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Start the app to visually verify**

Run: `cd /Users/maximecaron/Dev_perso/loup_garou && npx expo start`
Verify: splash animation plays, home shows logo, all screens have gold CardFrame borders, Cinzel font renders for titles.
