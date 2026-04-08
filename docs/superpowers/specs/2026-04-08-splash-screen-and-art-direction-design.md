# Splash Screen & Direction Artistique — Design Spec

## Contexte

L'application Garouf dispose d'un nouveau logo (`assets/logo-app.png`) représentant deux loups agressifs avec une lune dorée et le titre "GAROUF — Jeu du Loup-Garou". L'objectif est d'intégrer ce logo au démarrage de l'app et de créer une direction artistique cohérente pour l'ensemble de l'application.

## Décisions de design

- **Ambiance** : Sombre & Immersive (nuit, forêt, mystère)
- **Splash** : Animation d'entrée (splash natif + animation React Native)
- **Style écrans** : Carte de jeu (bordures ornementées, coins dorés, style médiéval)
- **Typographie** : Police custom fantasy (Cinzel) pour les titres + système pour le contenu

---

## Volet 1 — Splash Screen animé

### Flux de démarrage

1. **Splash natif Expo** : Le logo `logo-app.png` centré sur fond `#1a1a2e`. Configuré dans `app.json`. Affiché instantanément par le système avant le chargement JS.

2. **Écran d'animation (`app/splash.tsx`)** :
   - `expo-splash-screen` garde le splash natif visible pendant le chargement
   - Quand les fonts sont chargées, on cache le splash natif et on affiche l'écran animé
   - Animation : logo part en `opacity: 0` + `scale: 0.85`, anime vers `opacity: 1` + `scale: 1` sur ~800ms avec easing doux (`react-native-reanimated`)
   - Après ~1.5s total, navigation automatique vers `index.tsx`

3. **Home (`app/index.tsx`)** : Le logo remplace l'emoji loup 🐺. Image réduite, centrée au-dessus du titre "Garouf".

### Dépendances

- `expo-splash-screen` (inclus dans Expo SDK)
- `react-native-reanimated` (inclus dans Expo SDK)

---

## Volet 2 — Direction Artistique

### Palette de couleurs

Enrichissement de `theme/colors.ts` avec les couleurs du logo :

```ts
export const colors = {
  // Fonds (inchangés)
  background: "#1a1a2e",
  surface: "#16213e",
  surfaceLight: "#0f3460",

  // Couleur principale — or du logo (remplace l'ancien rouge)
  primary: "#D4A017",
  primaryLight: "#E8B828",
  goldDark: "#A67C00",

  // Accents du logo
  wolfBlue: "#3A5F8A",
  ember: "#E87C2A",

  // Texte (inchangé)
  text: "#eee",
  textSecondary: "#aaa",
  textMuted: "#666",

  // Sémantiques
  success: "#4ecca3",
  danger: "#e94560",
  warning: "#E87C2A",

  // Utilitaires (inchangés)
  white: "#fff",
  black: "#000",
  overlay: "rgba(0,0,0,0.7)",
};
```

**Changement clé** : `primary` passe de `#e94560` (rouge) à `#D4A017` (or). Le rouge est conservé uniquement en `danger` pour les actions destructives.

### Typographie

**Police : Cinzel** (Google Font, libre de droits)

- Chargée via `expo-font` / `useFonts` dans `app/_layout.tsx`
- Variantes : `Cinzel-Regular`, `Cinzel-Bold`

**Hiérarchie :**

| Niveau | Police | Taille | Couleur |
|--------|--------|--------|---------|
| Titre principal | Cinzel Bold | 28-32px | `#D4A017` (or) |
| Sous-titre / phase | Cinzel Regular | 20-22px | `#eee` |
| Corps de texte | Système | 16px | `#eee` |
| Texte secondaire | Système | 14px | `#aaa` |
| Labels | Système | 12px | `#666` |

### Composant CardFrame

**Fichier** : `components/CardFrame.tsx`

Wrapper réutilisable donnant le style "carte de jeu" aux écrans.

**Props :**
- `children: ReactNode` — contenu de l'écran
- `title?: string` — titre en Cinzel Bold doré
- `subtitle?: string` — sous-titre en Cinzel Regular

**Rendu :**
- Bordure dorée `#D4A017` de 2px, `borderRadius: 16`
- 4 coins renforcés (éléments `View` positionnés en absolu avec bordures dorées plus épaisses)
- Padding intérieur de 20px
- Titre centré en haut avec séparateur doré horizontal (`LinearGradient` ou simple `View` avec gradient de bordure)

**Application :**
- Tous les écrans de jeu (`players-setup`, `roles-setup`, `distribution`, `night`, `day`, `hunter`, `end`) sont wrappés dans `CardFrame`
- Exceptions : `splash.tsx` et `index.tsx` (home) qui ont leur propre layout avec le logo

### Configuration Expo (app.json)

- `splash.image` → pointe vers le logo `./assets/logo-app.png`
- `splash.backgroundColor` → reste `#1a1a2e`
- `icon` → mettre à jour avec le logo ou une version adaptée
- `android.adaptiveIcon.foregroundImage` → version adaptée du logo

---

## Prérequis

- Renommer `assets/ logo-app.png` → `assets/logo-app.png` (supprimer l'espace dans le nom de fichier)
- Télécharger les fichiers de police Cinzel (Regular + Bold) depuis Google Fonts et les placer dans `assets/fonts/`

## Écrans impactés

| Écran | Changements |
|-------|-------------|
| `app.json` | Splash image, icon, adaptive icon |
| `app/_layout.tsx` | Chargement fonts Cinzel, header doré |
| `app/splash.tsx` | **Nouveau** — écran d'animation du logo |
| `app/index.tsx` | Logo image remplace emoji, bouton doré |
| `app/players-setup.tsx` | CardFrame + palette dorée |
| `app/roles-setup.tsx` | CardFrame + palette dorée |
| `app/distribution.tsx` | CardFrame + palette dorée |
| `app/night.tsx` | CardFrame + palette dorée |
| `app/day.tsx` | CardFrame + palette dorée |
| `app/hunter.tsx` | CardFrame + palette dorée |
| `app/end.tsx` | CardFrame + palette dorée |
| `theme/colors.ts` | Nouvelle palette |
| `components/CardFrame.tsx` | **Nouveau** — composant carte de jeu |
