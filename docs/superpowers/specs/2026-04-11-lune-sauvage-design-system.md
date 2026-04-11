# Garouf — Design System "Lune Sauvage"

## Contexte

L'app Garouf est un Loup-Garou online/local pour la pause du midi. Le POC actuel a des composants incoherents entre les vues et des textes illisibles sur certains backgrounds (village ensoleille, parchemin). Ce spec definit le design system unifie et le showcase HTML de toutes les vues online.

## Direction Artistique

**Nom** : Lune Sauvage — fusion de "Nuit Etoilee" (typo/couleurs modernes) et "Croc de Lune" (formes anguleuses).

- **Typographie** : Playfair Display (titres) + Outfit (body/UI)
- **Couleurs** : Bleu lunaire `#7eb8da` + ambre `#e8a849` sur fond `#0a0e16`
- **Formes** : border-radius 6px, coins decoratifs accent
- **Lisibilite** : Glass panels 86% opacity + backdrop-blur sur tous les backgrounds

## Partie 1 : Design System React Native

### 1.1 Theme

#### `theme/colors.ts`

Remplacer la palette existante par :

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

  // Glass
  glass: "rgba(8,12,20,0.86)",
  glassBorder: "rgba(126,184,218,0.1)",

  // Utilities
  white: "#fff",
  black: "#000",
  overlay: "rgba(0,0,0,0.7)",
} as const;
```

#### `theme/typography.ts`

```ts
export const fonts = {
  displayBold: "PlayfairDisplay_700Bold",
  displayRegular: "PlayfairDisplay_400Regular",
  bodyRegular: "Outfit_400Regular",
  bodyMedium: "Outfit_500Medium",
  bodySemiBold: "Outfit_600SemiBold",
  bodyBold: "Outfit_700Bold",
} as const;

export const typography = {
  heading: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.text },
  subheading: { fontFamily: fonts.displayRegular, fontSize: 20, color: colors.text },
  body: { fontFamily: fonts.bodyRegular, fontSize: 16, color: colors.text },
  bodySecondary: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, letterSpacing: 2, textTransform: "uppercase" },
  timer: { fontFamily: fonts.displayBold, fontSize: 48, color: colors.text },
} as const;
```

#### `theme/spacing.ts` (nouveau)

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
  base: 6,  // border-radius par defaut — anguleux
  lg: 10,
  pill: 100,
} as const;
```

### 1.2 Composants

Convention : prefixe `G`, fichiers dans `components/`.

#### `GButton`

**Props** : `variant` (primary | outline | ghost | danger | warm), `disabled`, `loading`, `children`

| Variant | Background | Border | Text color |
|---------|-----------|--------|-----------|
| primary | `colors.accent` | none | `colors.background` |
| outline | transparent + backdrop-blur | `colors.accentDim` | `colors.accent` |
| ghost | `colors.glass` + backdrop-blur | `colors.glassBorder` | `colors.text` |
| danger | transparent | `rgba(danger, 0.2)` | `colors.danger` |
| warm | `colors.warm` | none | `colors.background` |

Tous : border-radius 6px, padding 14px vertical, font Outfit SemiBold 15px.

#### `GCardFrame`

**Props** : `variant` (solid | glass), `corners` (boolean, default true), `title?`, `subtitle?`, `children`

- **solid** : `background: colors.background`, `border: surfaceBorder`
- **glass** : `background: colors.glass`, `backdrop-filter: blur(16px)`, `border: glassBorder`
- **corners** : 2 pseudo-elements (top-left + bottom-right) en `colors.accent`, 14x14px, border 2px
- Title en Playfair Display Bold, subtitle en Outfit Regular

#### `GInput`

**Props** : `label?`, `error?`, `placeholder`, `value`, `onChangeText`

- Background `colors.surface`, border `colors.surfaceBorder`, border-radius 6px
- Focus state : border `colors.accent`
- Error state : border `rgba(danger, 0.5)`, message en `colors.danger` en dessous
- Label en style `typography.label` au dessus
- Font Outfit Regular 16px

#### `GPlayerRow`

**Props** : `name`, `avatarLetter`, `badge?` ({ text, variant }), `highlighted?`, `eliminated?`

- Background `colors.surface`, border `colors.surfaceBorder`, border-radius 6px
- Avatar : 28x28, border-radius 4px (anguleux), bg `rgba(accent, 0.06)`, border `accentDim`
- Badge : petit tag aligne a droite (host en ambre, alive en success, dead en danger)
- Eliminated : opacity 0.5, name barre

#### `GRoleCard`

**Props** : `image` (require source), `name`, `count`, `onIncrement`, `onDecrement`, `active` (count > 0)

- Card : bg `colors.surface`, border `surfaceBorder`, border-radius 6px
- Image : aspect-ratio 2:3, border-radius 4px
- Name : Outfit SemiBold 10px uppercase
- Counter : boutons +/- (24x24, radius 4px) avec valeur au centre
- Active state : border `colors.accent`, leger bg tint

#### `GRoleCardGrid`

**Props** : `roles[]`, `onChange`, `totalNeeded`, `preset?`

- Grid 3 colonnes, gap 8px
- Header avec section title + compteur (accent si match, warm si mismatch)
- Bouton "Preset auto"

#### `GBadge`

**Props** : `text`, `variant` (host | alive | dead | wolf | role | raven | spectator)

- Pill shape (radius 100px), padding 4px 10px
- Chaque variant a sa couleur de fond + texte + border

#### `GTimer`

**Props** : `seconds`, `onExpire`, `urgentThreshold?` (default 5)

- Affiche MM:SS, Playfair Display Bold
- Couleur normale : `colors.text`
- Sous le threshold : `colors.danger` + pulse animation

#### `GScreenBg`

**Props** : `source` (image require), `overlay?` (gradient config), `children`

- Wraps `ImageBackground` + gradient overlay + `SafeAreaView`
- Overlay par defaut : gradient top-to-bottom (0.3 → 0.15 → 0.5)
- Gere les safe areas via `useSafeAreaInsets`

#### `GModal`

**Props** : `visible`, `onClose`, `title?`, `children`

- Bottom-sheet style : slide du bas, coins top arrondis (radius 16px)
- Background `colors.background`, border-top 2px `colors.accent`
- Corners decoratifs en haut
- Overlay sombre derriere

#### `GPotionCard`

**Props** : `image`, `title`, `available`, `active`, `onPress`, `variant` (life | death)

- Card avec border-radius 6px
- Life : bg teinte rouge, border danger
- Death : bg teinte vert, border success
- Depleted : opacity 0.4, badge "Epuisee"
- Pulse animation quand available et pas encore utilise

### 1.3 Fonts a installer

```bash
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/outfit
```

Charger dans `_layout.tsx` en plus de Cinzel (garder Cinzel pour les cartes de roles existantes qui l'utilisent en fallback).

## Partie 2 : Showcase HTML — Ecrans complets

### 2.1 Ecrans existants (9)

1. Accueil (fond-home.png)
2. Inscription joueurs (inscription-joueur-background.png)
3. Annonce du matin (sun-transition-background.png)
4. Debat (debat-background.png)
5. Action de nuit (night-transition-background.png)
6. Vote du village (sunset-background.png)
7. Lobby hote complet
8. Lobby roles incomplets
9. Lobby vue joueur

### 2.2 Ecrans a ajouter (~15)

**Pre-game**
10. Rejoindre une partie — input code (4-6 chars) + pseudo, fond uni

**Distribution**
11. Carte face cachee — back-card centree, hint "Appuyez", devoilement-background.png (texture bois)
12. Carte revelee — role card visible, nom du role, hint "Maintiens pour voir ton pouvoir", bouton "Pret" + compteur "X/Y joueurs prets"

**Nuit**
13. Transition nuit — "La nuit tombe..." texte centre, fond night-transition-background.png, overlay forte
14. Attente nuit — "La Voyante ouvre les yeux..." + spinner, fond uni sombre
15. Action Voyante/Salvateur — instruction + timer + liste de cibles dans glass panels, fond night
16. Vote des loups — instruction + timer + liste avec indicateurs votes, fond night
17. Sorciere — 2 potion cards cote a cote + banniere victime + boutons confirmer/passer, fond night
18. Petite Fille — "Tu apercois des silhouettes..." + liste des noms de loups + timer, fond night

**Jour**
19. Marque du Corbeau — nom du joueur marque en violet + texte explicatif, fond sun-transition

**Etats speciaux**
20. Chasseur — "Tu es le Chasseur !" + timer + liste de cibles, fond sunset
21. Spectateur — skull + "Tu es elimine(e)" + phase en cours, fond uni sombre
22. Fin Victoire loups — titre + message victoire rouge/ambre, fond night
23. Fin Victoire village — titre + message victoire bleu/success, fond sun-transition

### 2.3 Backgrounds par ecran

| Ecran | Background | Overlay |
|-------|-----------|---------|
| Accueil | fond-home.png | Leger (0.1) |
| Players setup | inscription-joueur-background.png | Aucun |
| Distribution | devoilement-background.png | Leger (0.2) |
| Transition nuit | night-transition-background.png | Fort (0.5) |
| Actions de nuit | night-transition-background.png | Moyen-fort (0.4→0.6) |
| Annonce matin | sun-transition-background.png | Moyen (0.3→0.45) |
| Debat | debat-background.png | Moyen (0.25→0.4) |
| Vote | sunset-background.png | Moyen (0.3→0.6) |
| Chasseur | sunset-background.png | Moyen (0.3→0.6) |
| Fin village | sun-transition-background.png | Moyen (0.3) |
| Fin loups | night-transition-background.png | Fort (0.5) |
| Lobby, Create, Join, Spectator, Wait | Fond uni `#0a0e16` | N/A |
