# Nouveaux rôles, ordre de nuit dynamique et paramétrage — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter 6 nouveaux rôles (Cupidon, Petite Fille, Salvateur, Ancien, Corbeau, Idiot du Village), un ordre de nuit dynamique, un paramétrage de partie avec presets/équilibrage, et un écran Grimoire.

**Architecture:** Approche hybride pragmatique — le reducer `GameContext.tsx` reste centralisé mais délègue la logique métier à 4 modules dans `game/` (roles, nightEngine, balance, resolution). Un nouvel écran Grimoire affiche les rôles depuis le registre unique.

**Tech Stack:** React Native 0.81 / Expo 54 / TypeScript / expo-router / React Context + useReducer

**Spec:** `docs/superpowers/specs/2026-04-09-roles-and-game-parameters-design.md`

---

## Task 1: Registre des rôles (`game/roles.ts`)

**Files:**
- Create: `game/roles.ts`
- Test: `__tests__/roles.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/roles.test.ts
import { ROLE_REGISTRY, type RoleDefinition } from "../game/roles";

describe("ROLE_REGISTRY", () => {
  const allRoles = Object.values(ROLE_REGISTRY);

  it("contains all 11 roles", () => {
    expect(Object.keys(ROLE_REGISTRY)).toHaveLength(11);
    expect(Object.keys(ROLE_REGISTRY).sort()).toEqual([
      "cupid", "elder", "hunter", "little_girl", "raven",
      "savior", "seer", "village_idiot", "villager", "werewolf", "witch",
    ]);
  });

  it("every role has required fields", () => {
    for (const role of allRoles) {
      expect(role.id).toBeDefined();
      expect(role.label).toBeDefined();
      expect(role.emoji).toBeDefined();
      expect(["village", "werewolves"]).toContain(role.camp);
      expect(role.description.length).toBeGreaterThan(0);
      expect(typeof role.min).toBe("number");
      expect(typeof role.max).toBe("number");
    }
  });

  it("werewolf is the only werewolves camp role", () => {
    const wolfCamp = allRoles.filter((r) => r.camp === "werewolves");
    expect(wolfCamp).toHaveLength(1);
    expect(wolfCamp[0].id).toBe("werewolf");
  });

  it("only cupid is firstNightOnly", () => {
    const firstNight = allRoles.filter((r) => r.firstNightOnly);
    expect(firstNight).toHaveLength(1);
    expect(firstNight[0].id).toBe("cupid");
  });

  it("only little_girl is activeEveryOtherNight", () => {
    const everyOther = allRoles.filter((r) => r.activeEveryOtherNight);
    expect(everyOther).toHaveLength(1);
    expect(everyOther[0].id).toBe("little_girl");
  });

  it("passive roles have null nightOrder", () => {
    const passiveRoles = ["villager", "hunter", "elder", "village_idiot"];
    for (const id of passiveRoles) {
      expect(ROLE_REGISTRY[id as keyof typeof ROLE_REGISTRY].nightOrder).toBeNull();
    }
  });

  it("werewolf max is 4, special roles max is 1", () => {
    expect(ROLE_REGISTRY.werewolf.max).toBe(4);
    expect(ROLE_REGISTRY.seer.max).toBe(1);
    expect(ROLE_REGISTRY.cupid.max).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/roles.test.ts --no-cache`
Expected: FAIL — cannot find module `../game/roles`

- [ ] **Step 3: Write the implementation**

```typescript
// game/roles.ts
import { ImageSourcePropType } from "react-native";

export type Role =
  | "werewolf" | "villager" | "seer" | "witch" | "hunter"
  | "cupid" | "little_girl" | "savior" | "elder" | "raven" | "village_idiot";

export interface RoleDefinition {
  id: Role;
  label: string;
  emoji: string;
  camp: "village" | "werewolves";
  description: string;
  min: number;
  max: number;
  nightOrder: number | null;
  firstNightOnly: boolean;
  activeEveryOtherNight: boolean;
  cardImage?: ImageSourcePropType;
}

export const ROLE_REGISTRY: Record<Role, RoleDefinition> = {
  werewolf: {
    id: "werewolf",
    label: "Loup-Garou",
    emoji: "🐺",
    camp: "werewolves",
    description: "Chaque nuit, les Loups-Garous se réveillent ensemble et choisissent un villageois à dévorer.",
    min: 1,
    max: 4,
    nightOrder: 40,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/loup-garou-card.png"),
  },
  villager: {
    id: "villager",
    label: "Villageois",
    emoji: "🧑‍🌾",
    camp: "village",
    description: "Aucun pouvoir spécial. Utilise la déduction et la persuasion pour identifier les Loups-Garous.",
    min: 0,
    max: Infinity,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  seer: {
    id: "seer",
    label: "Voyante",
    emoji: "🔮",
    camp: "village",
    description: "Chaque nuit, la Voyante découvre le rôle d'un joueur de son choix. Elle doit rester discrète.",
    min: 0,
    max: 1,
    nightOrder: 20,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/voyante-card.png"),
  },
  witch: {
    id: "witch",
    label: "Sorcière",
    emoji: "🧪",
    camp: "village",
    description: "Possède une potion de guérison et une potion de mort, chacune utilisable une seule fois.",
    min: 0,
    max: 1,
    nightOrder: 50,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/sorciere-card.png"),
  },
  hunter: {
    id: "hunter",
    label: "Chasseur",
    emoji: "🏹",
    camp: "village",
    description: "Quand il est éliminé, il emporte immédiatement un autre joueur avec lui.",
    min: 0,
    max: 1,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
    cardImage: require("../assets/cards/chasseur-card.png"),
  },
  cupid: {
    id: "cupid",
    label: "Cupidon",
    emoji: "💘",
    camp: "village",
    description: "La première nuit, il désigne 2 joueurs qui deviennent Amoureux. Si l'un meurt, l'autre meurt de chagrin.",
    min: 0,
    max: 1,
    nightOrder: 5,
    firstNightOnly: true,
    activeEveryOtherNight: false,
  },
  little_girl: {
    id: "little_girl",
    label: "Petite Fille",
    emoji: "👧",
    camp: "village",
    description: "Une nuit sur deux, elle entrouvre les yeux et aperçoit des silhouettes dont au moins un Loup-Garou.",
    min: 0,
    max: 1,
    nightOrder: 60,
    firstNightOnly: false,
    activeEveryOtherNight: true,
  },
  savior: {
    id: "savior",
    label: "Salvateur",
    emoji: "🛡️",
    camp: "village",
    description: "Chaque nuit, il protège un joueur contre l'attaque des Loups. Pas le même deux nuits de suite.",
    min: 0,
    max: 1,
    nightOrder: 30,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  elder: {
    id: "elder",
    label: "Ancien",
    emoji: "👴",
    camp: "village",
    description: "Résiste à la première attaque des Loups-Garous. Si le village l'élimine, tous les pouvoirs spéciaux sont perdus.",
    min: 0,
    max: 1,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  raven: {
    id: "raven",
    label: "Corbeau",
    emoji: "🐦‍⬛",
    camp: "village",
    description: "Chaque nuit, il marque un joueur qui commencera le vote avec 2 voix contre lui.",
    min: 0,
    max: 1,
    nightOrder: 55,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
  village_idiot: {
    id: "village_idiot",
    label: "Idiot du Village",
    emoji: "🤪",
    camp: "village",
    description: "S'il est éliminé par le vote du village, il survit mais perd son droit de vote.",
    min: 0,
    max: 1,
    nightOrder: null,
    firstNightOnly: false,
    activeEveryOtherNight: false,
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/roles.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game/roles.ts __tests__/roles.test.ts
git commit -m "feat: add role registry with all 11 role definitions"
```

---

## Task 2: Presets et équilibrage (`game/balance.ts`)

**Files:**
- Create: `game/balance.ts`
- Test: `__tests__/balance.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/balance.test.ts
import { getPreset, getBalanceWarnings } from "../game/balance";
import type { Role } from "../game/roles";

describe("getPreset", () => {
  it("returns preset for 8 players", () => {
    const preset = getPreset(8);
    expect(preset.werewolf).toBe(2);
    expect(preset.seer).toBe(1);
    expect(preset.witch).toBe(1);
    expect(preset.hunter).toBe(1);
    expect(preset.cupid).toBe(0);
    expect(preset.villager).toBe(3);
  });

  it("returns preset for 10 players with 3 wolves", () => {
    const preset = getPreset(10);
    expect(preset.werewolf).toBe(3);
    expect(preset.cupid).toBe(1);
  });

  it("returns preset for 14 players with 4 wolves", () => {
    const preset = getPreset(14);
    expect(preset.werewolf).toBe(4);
    expect(preset.savior).toBe(1);
    expect(preset.elder).toBe(1);
  });

  it("villager count always fills remaining spots", () => {
    for (let n = 6; n <= 18; n++) {
      const preset = getPreset(n);
      const total = Object.values(preset).reduce((a, b) => a + b, 0);
      expect(total).toBe(n);
    }
  });

  it("clamps to 6 for fewer players", () => {
    const preset = getPreset(4);
    expect(preset).toEqual(getPreset(6));
  });

  it("clamps to 18 for more players", () => {
    const preset = getPreset(25);
    expect(preset).toEqual(getPreset(18));
  });
});

describe("getBalanceWarnings", () => {
  const baseComposition = (): Record<Role, number> => ({
    werewolf: 2, villager: 3, seer: 1, witch: 1, hunter: 1,
    cupid: 0, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0,
  });

  it("returns no warnings for recommended preset", () => {
    const preset = getPreset(8);
    expect(getBalanceWarnings(8, preset)).toEqual([]);
  });

  it("warns when too many werewolves", () => {
    const comp = { ...baseComposition(), werewolf: 4, villager: 1 };
    const warnings = getBalanceWarnings(8, comp);
    expect(warnings.some((w) => w.includes("Loups-Garous"))).toBe(true);
  });

  it("warns when no information roles", () => {
    const comp: Record<Role, number> = {
      werewolf: 2, villager: 6, seer: 0, witch: 0, hunter: 0,
      cupid: 0, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0,
    };
    const warnings = getBalanceWarnings(8, comp);
    expect(warnings.some((w) => w.includes("information"))).toBe(true);
  });

  it("warns when not enough simple villagers", () => {
    const comp: Record<Role, number> = {
      werewolf: 2, villager: 0, seer: 1, witch: 1, hunter: 1,
      cupid: 1, little_girl: 1, savior: 1, elder: 0, raven: 0, village_idiot: 0,
    };
    const warnings = getBalanceWarnings(8, comp);
    expect(warnings.some((w) => w.includes("Villageois"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/balance.test.ts --no-cache`
Expected: FAIL — cannot find module `../game/balance`

- [ ] **Step 3: Write the implementation**

```typescript
// game/balance.ts
import type { Role } from "./roles";

type Composition = Record<Role, number>;

const PRESETS: Record<number, Composition> = {
  6:  { werewolf: 2, seer: 1, witch: 0, hunter: 0, cupid: 0, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  7:  { werewolf: 2, seer: 1, witch: 1, hunter: 0, cupid: 0, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  8:  { werewolf: 2, seer: 1, witch: 1, hunter: 1, cupid: 0, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  9:  { werewolf: 2, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  10: { werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 0, savior: 0, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  11: { werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 0, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  12: { werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 0, raven: 0, village_idiot: 0, villager: 3 },
  13: { werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 0, village_idiot: 0, villager: 3 },
  14: { werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 0, village_idiot: 0, villager: 2 },
  15: { werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 0, villager: 2 },
  16: { werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 1, villager: 2 },
  17: { werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 1, villager: 3 },
  18: { werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 1, villager: 4 },
};

export function getPreset(playerCount: number): Composition {
  const clamped = Math.max(6, Math.min(18, playerCount));
  return { ...PRESETS[clamped] };
}

export function getBalanceWarnings(playerCount: number, composition: Composition): string[] {
  const warnings: string[] = [];
  const recommended = getPreset(playerCount);

  // Too many werewolves
  if (composition.werewolf > recommended.werewolf + 1) {
    warnings.push(
      `Trop de Loups-Garous pour ${playerCount} joueurs (recommandé : ${recommended.werewolf})`
    );
  }

  // No information roles
  if (composition.seer === 0 && composition.witch === 0) {
    warnings.push("Aucune Voyante ni Sorcière — le village manque d'information");
  }

  // Not enough simple villagers
  if (composition.villager < 1) {
    warnings.push("Pas assez de Villageois simples — les rôles sont trop devinables");
  }

  // Wolf ratio check
  const totalNonWolf = playerCount - composition.werewolf;
  if (totalNonWolf > 0 && composition.werewolf / totalNonWolf > 0.5) {
    warnings.push("Le ratio Loups/Villageois semble déséquilibré");
  }

  // Cupid recommendation
  if (composition.cupid > 0 && playerCount < 9) {
    warnings.push("Le Cupidon est plus intéressant à partir de 9 joueurs");
  }

  return warnings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/balance.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game/balance.ts __tests__/balance.test.ts
git commit -m "feat: add game balance presets and warning system"
```

---

## Task 3: Moteur de nuit dynamique (`game/nightEngine.ts`)

**Files:**
- Create: `game/nightEngine.ts`
- Test: `__tests__/nightEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/nightEngine.test.ts
import { buildNightSteps } from "../game/nightEngine";
import type { Role } from "../game/roles";

interface TestPlayer {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
}

function makePlayer(id: string, role: Role, isAlive = true): TestPlayer {
  return { id, name: `Player${id}`, role, isAlive };
}

describe("buildNightSteps", () => {
  it("returns basic steps when only werewolves and villagers", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "villager"),
      makePlayer("3", "villager"),
    ];
    const steps = buildNightSteps(players, false, 1, false);
    expect(steps).toEqual(["intro", "werewolves", "resolution"]);
  });

  it("includes seer and witch when alive", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "seer"),
      makePlayer("3", "witch"),
      makePlayer("4", "villager"),
    ];
    const steps = buildNightSteps(players, false, 1, false);
    expect(steps).toEqual(["intro", "seer", "werewolves", "witch", "resolution"]);
  });

  it("skips dead roles", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "seer", false),
      makePlayer("3", "witch"),
      makePlayer("4", "villager"),
    ];
    const steps = buildNightSteps(players, false, 1, false);
    expect(steps).toEqual(["intro", "werewolves", "witch", "resolution"]);
  });

  it("includes cupid and lovers_reveal on first night", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "cupid"),
      makePlayer("3", "villager"),
    ];
    const steps = buildNightSteps(players, true, 1, false);
    expect(steps).toEqual(["intro", "cupid", "lovers_reveal", "werewolves", "resolution"]);
  });

  it("excludes cupid on subsequent nights", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "cupid"),
      makePlayer("3", "villager"),
    ];
    const steps = buildNightSteps(players, false, 2, false);
    expect(steps).toEqual(["intro", "werewolves", "resolution"]);
  });

  it("includes savior before werewolves", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "savior"),
      makePlayer("3", "villager"),
    ];
    const steps = buildNightSteps(players, false, 1, false);
    expect(steps).toEqual(["intro", "savior", "werewolves", "resolution"]);
  });

  it("includes raven after witch", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "witch"),
      makePlayer("3", "raven"),
      makePlayer("4", "villager"),
    ];
    const steps = buildNightSteps(players, false, 1, false);
    expect(steps).toEqual(["intro", "werewolves", "witch", "raven", "resolution"]);
  });

  it("includes little_girl on odd turns only", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "little_girl"),
      makePlayer("3", "villager"),
    ];
    expect(buildNightSteps(players, false, 1, false)).toContain("little_girl");
    expect(buildNightSteps(players, false, 2, false)).not.toContain("little_girl");
    expect(buildNightSteps(players, false, 3, false)).toContain("little_girl");
  });

  it("removes all special steps when elder killed by village", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "seer"),
      makePlayer("3", "witch"),
      makePlayer("4", "savior"),
      makePlayer("5", "raven"),
      makePlayer("6", "little_girl"),
      makePlayer("7", "villager"),
    ];
    const steps = buildNightSteps(players, false, 1, true);
    expect(steps).toEqual(["intro", "werewolves", "resolution"]);
  });

  it("full first night with all roles", () => {
    const players = [
      makePlayer("1", "werewolf"),
      makePlayer("2", "cupid"),
      makePlayer("3", "seer"),
      makePlayer("4", "savior"),
      makePlayer("5", "witch"),
      makePlayer("6", "raven"),
      makePlayer("7", "little_girl"),
      makePlayer("8", "villager"),
    ];
    const steps = buildNightSteps(players, true, 1, false);
    expect(steps).toEqual([
      "intro", "cupid", "lovers_reveal", "seer", "savior",
      "werewolves", "witch", "raven", "little_girl", "resolution",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/nightEngine.test.ts --no-cache`
Expected: FAIL — cannot find module `../game/nightEngine`

- [ ] **Step 3: Write the implementation**

```typescript
// game/nightEngine.ts
import type { Role } from "./roles";

export type NightStep =
  | "intro"
  | "cupid"
  | "lovers_reveal"
  | "seer"
  | "savior"
  | "werewolves"
  | "witch"
  | "raven"
  | "little_girl"
  | "resolution";

interface PlayerLike {
  role: Role | null;
  isAlive: boolean;
}

function hasAliveRole(players: PlayerLike[], role: Role): boolean {
  return players.some((p) => p.role === role && p.isAlive);
}

export function buildNightSteps(
  players: PlayerLike[],
  isFirstNight: boolean,
  currentTurn: number,
  elderKilledByVillage: boolean
): NightStep[] {
  const steps: NightStep[] = ["intro"];

  // First night only: Cupidon
  if (isFirstNight && hasAliveRole(players, "cupid")) {
    steps.push("cupid", "lovers_reveal");
  }

  if (elderKilledByVillage) {
    // All village powers are lost — only werewolves act
    steps.push("werewolves");
    steps.push("resolution");
    return steps;
  }

  // Seer
  if (hasAliveRole(players, "seer")) {
    steps.push("seer");
  }

  // Savior
  if (hasAliveRole(players, "savior")) {
    steps.push("savior");
  }

  // Werewolves (always)
  steps.push("werewolves");

  // Witch
  if (hasAliveRole(players, "witch")) {
    steps.push("witch");
  }

  // Raven
  if (hasAliveRole(players, "raven")) {
    steps.push("raven");
  }

  // Little Girl (odd turns only)
  if (hasAliveRole(players, "little_girl") && currentTurn % 2 !== 0) {
    steps.push("little_girl");
  }

  steps.push("resolution");
  return steps;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/nightEngine.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game/nightEngine.ts __tests__/nightEngine.test.ts
git commit -m "feat: add dynamic night engine with conditional step ordering"
```

---

## Task 4: Résolution des morts (`game/resolution.ts`)

**Files:**
- Create: `game/resolution.ts`
- Test: `__tests__/resolution.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/resolution.test.ts
import { resolveNight, resolveVote, generateLittleGirlClue } from "../game/resolution";
import type { Role } from "../game/roles";

interface TestPlayer {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
}

function makePlayer(id: string, name: string, role: Role, isAlive = true): TestPlayer {
  return { id, name, role, isAlive };
}

function makeNightState(overrides: Partial<Parameters<typeof resolveNight>[0]> = {}) {
  return {
    players: [
      makePlayer("1", "Wolf", "werewolf"),
      makePlayer("2", "Victim", "villager"),
      makePlayer("3", "Other", "villager"),
    ],
    nightActions: {
      werewolvesTarget: "2",
      seerTarget: null,
      witchHeal: false,
      witchKill: null,
    },
    witchPotions: { life: true, death: true },
    saviorTarget: null,
    elderLives: 2,
    lovers: null,
    elderKilledByVillage: false,
    ...overrides,
  };
}

describe("resolveNight", () => {
  it("kills werewolf target normally", () => {
    const result = resolveNight(makeNightState());
    expect(result.deaths).toEqual(["2"]);
    expect(result.savedBySavior).toBe(false);
    expect(result.savedByWitch).toBe(false);
  });

  it("savior protects the target", () => {
    const result = resolveNight(makeNightState({ saviorTarget: "2" }));
    expect(result.deaths).toEqual([]);
    expect(result.savedBySavior).toBe(true);
  });

  it("elder survives first werewolf attack", () => {
    const state = makeNightState({
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Elder", "elder"),
        makePlayer("3", "Other", "villager"),
      ],
      nightActions: { werewolvesTarget: "2", seerTarget: null, witchHeal: false, witchKill: null },
    });
    const result = resolveNight(state);
    expect(result.deaths).toEqual([]);
    expect(result.elderLostLife).toBe(true);
    expect(result.newElderLives).toBe(1);
  });

  it("elder dies on second werewolf attack", () => {
    const state = makeNightState({
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Elder", "elder"),
        makePlayer("3", "Other", "villager"),
      ],
      nightActions: { werewolvesTarget: "2", seerTarget: null, witchHeal: false, witchKill: null },
      elderLives: 1,
    });
    const result = resolveNight(state);
    expect(result.deaths).toEqual(["2"]);
    expect(result.elderLostLife).toBe(false);
  });

  it("witch heals target", () => {
    const state = makeNightState({
      nightActions: { werewolvesTarget: "2", seerTarget: null, witchHeal: true, witchKill: null },
    });
    const result = resolveNight(state);
    expect(result.deaths).toEqual([]);
    expect(result.savedByWitch).toBe(true);
    expect(result.updatedPotions.life).toBe(false);
  });

  it("witch poison kills separately", () => {
    const state = makeNightState({
      nightActions: { werewolvesTarget: "2", seerTarget: null, witchHeal: false, witchKill: "3" },
    });
    const result = resolveNight(state);
    expect(result.deaths).toContain("2");
    expect(result.deaths).toContain("3");
    expect(result.updatedPotions.death).toBe(false);
  });

  it("savior does not block witch poison", () => {
    const state = makeNightState({
      nightActions: { werewolvesTarget: "2", seerTarget: null, witchHeal: false, witchKill: "3" },
      saviorTarget: "3",
    });
    const result = resolveNight(state);
    expect(result.deaths).toContain("3");
  });

  it("lovers cascade when one dies", () => {
    const state = makeNightState({
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Lover1", "villager"),
        makePlayer("3", "Lover2", "villager"),
        makePlayer("4", "Other", "villager"),
      ],
      lovers: ["2", "3"] as [string, string],
    });
    const result = resolveNight(state);
    expect(result.deaths).toContain("2");
    expect(result.deaths).toContain("3");
    expect(result.loversCascade).toBe("3");
  });

  it("hunter triggers when killed", () => {
    const state = makeNightState({
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Hunter", "hunter"),
        makePlayer("3", "V1", "villager"),
        makePlayer("4", "V2", "villager"),
      ],
      nightActions: { werewolvesTarget: "2", seerTarget: null, witchHeal: false, witchKill: null },
    });
    const result = resolveNight(state);
    expect(result.hunterTriggered).toBe(true);
  });
});

describe("resolveVote", () => {
  it("kills voted player normally", () => {
    const state = {
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Victim", "villager"),
        makePlayer("3", "Other", "villager"),
      ],
      lovers: null,
      villageIdiotRevealed: false,
      elderKilledByVillage: false,
    };
    const result = resolveVote(state, "2");
    expect(result.deaths).toEqual(["2"]);
  });

  it("village idiot survives first vote", () => {
    const state = {
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Idiot", "village_idiot"),
        makePlayer("3", "Other", "villager"),
      ],
      lovers: null,
      villageIdiotRevealed: false,
      elderKilledByVillage: false,
    };
    const result = resolveVote(state, "2");
    expect(result.deaths).toEqual([]);
    expect(result.villageIdiotSurvived).toBe(true);
  });

  it("village idiot dies if already revealed", () => {
    const state = {
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Idiot", "village_idiot"),
        makePlayer("3", "Other", "villager"),
      ],
      lovers: null,
      villageIdiotRevealed: true,
      elderKilledByVillage: false,
    };
    const result = resolveVote(state, "2");
    expect(result.deaths).toEqual(["2"]);
    expect(result.villageIdiotSurvived).toBe(false);
  });

  it("killing elder triggers power loss", () => {
    const state = {
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Elder", "elder"),
        makePlayer("3", "Other", "villager"),
      ],
      lovers: null,
      villageIdiotRevealed: false,
      elderKilledByVillage: false,
    };
    const result = resolveVote(state, "2");
    expect(result.elderKilledByVillage).toBe(true);
  });

  it("lovers cascade on vote death", () => {
    const state = {
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Lover1", "villager"),
        makePlayer("3", "Lover2", "seer"),
        makePlayer("4", "Other", "villager"),
      ],
      lovers: ["2", "3"] as [string, string],
      villageIdiotRevealed: false,
      elderKilledByVillage: false,
    };
    const result = resolveVote(state, "2");
    expect(result.deaths).toContain("2");
    expect(result.deaths).toContain("3");
    expect(result.loversCascade).toBe("3");
  });

  it("hunter triggers on vote", () => {
    const state = {
      players: [
        makePlayer("1", "Wolf", "werewolf"),
        makePlayer("2", "Hunter", "hunter"),
        makePlayer("3", "V1", "villager"),
        makePlayer("4", "V2", "villager"),
      ],
      lovers: null,
      villageIdiotRevealed: false,
      elderKilledByVillage: false,
    };
    const result = resolveVote(state, "2");
    expect(result.hunterTriggered).toBe(true);
  });
});

describe("generateLittleGirlClue", () => {
  it("returns 2-3 players with at least 1 wolf", () => {
    const players = [
      makePlayer("1", "Wolf1", "werewolf"),
      makePlayer("2", "Wolf2", "werewolf"),
      makePlayer("3", "V1", "villager"),
      makePlayer("4", "V2", "villager"),
      makePlayer("5", "V3", "villager"),
      makePlayer("6", "Girl", "little_girl"),
    ];
    for (let i = 0; i < 20; i++) {
      const clue = generateLittleGirlClue(players);
      expect(clue.length).toBeGreaterThanOrEqual(2);
      expect(clue.length).toBeLessThanOrEqual(3);
      expect(clue).not.toContain("6"); // never includes little_girl herself
      const hasWolf = clue.some((id) =>
        players.find((p) => p.id === id)?.role === "werewolf"
      );
      expect(hasWolf).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/resolution.test.ts --no-cache`
Expected: FAIL — cannot find module `../game/resolution`

- [ ] **Step 3: Write the implementation**

```typescript
// game/resolution.ts
import type { Role } from "./roles";

interface PlayerLike {
  id: string;
  role: Role | null;
  isAlive: boolean;
}

interface NightActions {
  werewolvesTarget: string | null;
  seerTarget: string | null;
  witchHeal: boolean;
  witchKill: string | null;
}

interface NightInput {
  players: PlayerLike[];
  nightActions: NightActions;
  witchPotions: { life: boolean; death: boolean };
  saviorTarget: string | null;
  elderLives: number;
  lovers: [string, string] | null;
  elderKilledByVillage: boolean;
}

export interface NightResolution {
  deaths: string[];
  savedByWitch: boolean;
  savedBySavior: boolean;
  elderLostLife: boolean;
  newElderLives: number;
  hunterTriggered: boolean;
  loversCascade: string | null;
  updatedPotions: { life: boolean; death: boolean };
}

export function resolveNight(input: NightInput): NightResolution {
  const {
    players, nightActions, witchPotions, saviorTarget, elderLives, lovers,
  } = input;

  const deaths: string[] = [];
  let savedBySavior = false;
  let savedByWitch = false;
  let elderLostLife = false;
  let newElderLives = elderLives;
  const updatedPotions = { ...witchPotions };

  const target = nightActions.werewolvesTarget;

  if (target) {
    let targetSurvives = false;

    // 1. Savior protection
    if (saviorTarget === target) {
      targetSurvives = true;
      savedBySavior = true;
    }

    // 2. Elder extra life
    if (!targetSurvives) {
      const targetPlayer = players.find((p) => p.id === target);
      if (targetPlayer?.role === "elder" && elderLives > 1) {
        targetSurvives = true;
        elderLostLife = true;
        newElderLives = elderLives - 1;
      }
    }

    // 3. Witch heal
    if (!targetSurvives && nightActions.witchHeal) {
      targetSurvives = true;
      savedByWitch = true;
      updatedPotions.life = false;
    }

    if (!targetSurvives) {
      deaths.push(target);
    }

    // Consume heal potion even if savior already saved
    if (nightActions.witchHeal && !savedByWitch) {
      updatedPotions.life = false;
      savedByWitch = true;
    }
  }

  // 4. Witch poison (independent)
  if (nightActions.witchKill) {
    deaths.push(nightActions.witchKill);
    updatedPotions.death = false;
  }

  // 5. Lovers cascade
  let loversCascade: string | null = null;
  if (lovers) {
    const [lover1, lover2] = lovers;
    if (deaths.includes(lover1) && !deaths.includes(lover2)) {
      deaths.push(lover2);
      loversCascade = lover2;
    } else if (deaths.includes(lover2) && !deaths.includes(lover1)) {
      deaths.push(lover1);
      loversCascade = lover1;
    }
  }

  // 6. Hunter check
  const hunterTriggered = deaths.some(
    (id) => players.find((p) => p.id === id)?.role === "hunter"
  );

  return {
    deaths,
    savedByWitch,
    savedBySavior,
    elderLostLife,
    newElderLives,
    hunterTriggered,
    loversCascade,
    updatedPotions,
  };
}

interface VoteInput {
  players: PlayerLike[];
  lovers: [string, string] | null;
  villageIdiotRevealed: boolean;
  elderKilledByVillage: boolean;
}

export interface VoteResolution {
  deaths: string[];
  villageIdiotSurvived: boolean;
  hunterTriggered: boolean;
  loversCascade: string | null;
  elderKilledByVillage: boolean;
}

export function resolveVote(input: VoteInput, votedPlayerId: string): VoteResolution {
  const { players, lovers, villageIdiotRevealed, elderKilledByVillage } = input;
  const deaths: string[] = [];

  const votedPlayer = players.find((p) => p.id === votedPlayerId);

  // 1. Village Idiot survives first vote
  if (
    votedPlayer?.role === "village_idiot" &&
    !villageIdiotRevealed
  ) {
    return {
      deaths: [],
      villageIdiotSurvived: true,
      hunterTriggered: false,
      loversCascade: null,
      elderKilledByVillage,
    };
  }

  // 2. Player dies
  deaths.push(votedPlayerId);

  // 3. Elder killed by village
  let newElderKilledByVillage = elderKilledByVillage;
  if (votedPlayer?.role === "elder") {
    newElderKilledByVillage = true;
  }

  // 4. Lovers cascade
  let loversCascade: string | null = null;
  if (lovers) {
    const [lover1, lover2] = lovers;
    if (deaths.includes(lover1) && !deaths.includes(lover2)) {
      deaths.push(lover2);
      loversCascade = lover2;
    } else if (deaths.includes(lover2) && !deaths.includes(lover1)) {
      deaths.push(lover1);
      loversCascade = lover1;
    }
  }

  // 5. Hunter trigger
  const hunterTriggered = deaths.some(
    (id) => players.find((p) => p.id === id)?.role === "hunter"
  );

  return {
    deaths,
    villageIdiotSurvived: false,
    hunterTriggered,
    loversCascade,
    elderKilledByVillage: newElderKilledByVillage,
  };
}

// --- Little Girl Clue ---

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, count);
}

export function generateLittleGirlClue(players: PlayerLike[]): string[] {
  const aliveWolves = players.filter((p) => p.isAlive && p.role === "werewolf");
  const aliveNonWolves = players.filter(
    (p) => p.isAlive && p.role !== "werewolf" && p.role !== "little_girl"
  );

  const wolf = pickRandom(aliveWolves, 1);
  const decoyCount = 1 + Math.floor(Math.random() * 2); // 1 or 2
  const decoys = pickRandom(aliveNonWolves, decoyCount);

  return shuffleArray([...wolf.map((p) => p.id), ...decoys.map((p) => p.id)]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/resolution.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game/resolution.ts __tests__/resolution.test.ts
git commit -m "feat: add night and vote resolution engine with role interactions"
```

---

## Task 5: Refactorer `GameContext.tsx` — types, state, reducer

**Files:**
- Modify: `context/GameContext.tsx`
- Modify: `__tests__/gameReducer.test.ts`

Ce task est le plus gros. Il met à jour le type `Role` (réexporté depuis `game/roles.ts`), étend `GameState` avec les nouveaux champs, ajoute les nouvelles actions, et fait déléguer le reducer aux modules `game/`.

- [ ] **Step 1: Update the types and state in `GameContext.tsx`**

Remplacer le type `Role` local par un réexport de `game/roles.ts`. Étendre `NightStep` avec un réexport de `game/nightEngine.ts`. Ajouter les nouveaux champs au `GameState` et les nouvelles actions.

Changes clés :
- `export type { Role } from "../game/roles";` (supprimer la définition locale)
- `export type { NightStep } from "../game/nightEngine";` (supprimer la définition locale)
- Ajouter à `GameState` : `lovers`, `saviorTarget`, `lastSaviorTarget`, `elderLives`, `ravenTarget`, `littleGirlClue`, `littleGirlActiveNight`, `villageIdiotRevealed`, `isFirstNight`, `elderKilledByVillage`
- Ajouter à `GameAction` : `SET_LOVERS`, `SET_SAVIOR_TARGET`, `SET_RAVEN_TARGET`, `SET_LITTLE_GIRL_CLUE`
- Étendre `winner` : `"werewolves" | "villagers" | "lovers" | null`
- Ajouter à `initialState` les valeurs par défaut des nouveaux champs
- Modifier `checkWinner` pour accepter `lovers` et vérifier le couple mixte
- Remplacer `getNextNightStep` par usage de `buildNightSteps` dans le reducer
- Modifier `RESOLVE_NIGHT` pour utiliser `resolveNight()` de `game/resolution.ts`
- Modifier `VOTE_ELIMINATE` pour utiliser `resolveVote()` de `game/resolution.ts`
- Ajouter les handlers pour les nouvelles actions
- Dans `NEXT_PLAYER` (dernier joueur) : mettre `isFirstNight: true`
- Dans `START_NIGHT` après première nuit : mettre `isFirstNight: false`, copier `saviorTarget` dans `lastSaviorTarget`

Voir l'annexe A en fin de plan pour le code complet de `GameContext.tsx`.

- [ ] **Step 2: Update existing tests and add new ones**

Mettre à jour `makePlayer` pour accepter les nouveaux rôles. Ajouter des tests pour les nouvelles actions et pour `checkWinner` avec lovers.

Voir l'annexe B en fin de plan pour le code complet de `__tests__/gameReducer.test.ts`.

- [ ] **Step 3: Run all tests**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add context/GameContext.tsx __tests__/gameReducer.test.ts
git commit -m "feat: extend GameContext with new roles, state fields, and resolution delegation"
```

---

## Task 6: Mettre à jour `theme/roleCards.ts`

**Files:**
- Modify: `theme/roleCards.ts`

- [ ] **Step 1: Update role cards and labels**

```typescript
// theme/roleCards.ts
import { ImageSourcePropType } from "react-native";
import type { Role } from "../game/roles";

export const ROLE_CARDS: Partial<Record<Role, ImageSourcePropType>> = {
  werewolf: require("../assets/cards/loup-garou-card.png"),
  seer: require("../assets/cards/voyante-card.png"),
  witch: require("../assets/cards/sorciere-card.png"),
  hunter: require("../assets/cards/chasseur-card.png"),
};

export const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  werewolf: { label: "Loup-Garou", emoji: "🐺" },
  villager: { label: "Villageois", emoji: "🧑‍🌾" },
  seer: { label: "Voyante", emoji: "🔮" },
  witch: { label: "Sorcière", emoji: "🧪" },
  hunter: { label: "Chasseur", emoji: "🏹" },
  cupid: { label: "Cupidon", emoji: "💘" },
  little_girl: { label: "Petite Fille", emoji: "👧" },
  savior: { label: "Salvateur", emoji: "🛡️" },
  elder: { label: "Ancien", emoji: "👴" },
  raven: { label: "Corbeau", emoji: "🐦‍⬛" },
  village_idiot: { label: "Idiot du Village", emoji: "🤪" },
};
```

- [ ] **Step 2: Run tests to ensure no regression**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add theme/roleCards.ts
git commit -m "feat: add labels and emojis for 6 new roles in roleCards"
```

---

## Task 7: Écran Grimoire (`app/grimoire.tsx`) + bouton Home

**Files:**
- Create: `app/grimoire.tsx`
- Modify: `app/index.tsx`

- [ ] **Step 1: Create the Grimoire screen**

```typescript
// app/grimoire.tsx
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { ROLE_REGISTRY, type Role, type RoleDefinition } from "../game/roles";
import { ROLE_CARDS } from "../theme/roleCards";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

function InterventionBadge({ role }: { role: RoleDefinition }) {
  let label: string;
  let color: string;
  if (role.firstNightOnly) {
    label = "1ère nuit";
    color = colors.wolfBlue;
  } else if (role.nightOrder !== null) {
    label = role.activeEveryOtherNight ? "Nuit (1/2)" : "Nuit";
    color = colors.surfaceLight;
  } else if (role.id === "village_idiot") {
    label = "Jour";
    color = colors.ember;
  } else if (role.id === "hunter") {
    label = "À sa mort";
    color = colors.danger;
  } else {
    label = "Passif";
    color = colors.textMuted;
  }
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function RoleCard({ roleDef }: { roleDef: RoleDefinition }) {
  const cardImage = ROLE_CARDS[roleDef.id];
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        {cardImage ? (
          <Image source={cardImage} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.emojiContainer}>
            <Text style={styles.emojiLarge}>{roleDef.emoji}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.roleName}>{roleDef.emoji} {roleDef.label}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, {
            backgroundColor: roleDef.camp === "village" ? colors.success : colors.danger,
          }]}>
            <Text style={styles.badgeText}>
              {roleDef.camp === "village" ? "Village" : "Loups"}
            </Text>
          </View>
          <InterventionBadge role={roleDef} />
        </View>
        <Text style={styles.roleDescription}>{roleDef.description}</Text>
      </View>
    </View>
  );
}

export default function GrimoireScreen() {
  const router = useRouter();
  const allRoles = Object.values(ROLE_REGISTRY);
  const villageRoles = allRoles.filter((r) => r.camp === "village");
  const wolfRoles = allRoles.filter((r) => r.camp === "werewolves");

  return (
    <>
      <Stack.Screen options={{ title: "Grimoire", headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Grimoire des Rôles</Text>

        <Text style={styles.sectionTitle}>Camp du Village</Text>
        {villageRoles.map((r) => (
          <RoleCard key={r.id} roleDef={r} />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionWolves]}>
          Camp des Loups-Garous
        </Text>
        {wolfRoles.map((r) => (
          <RoleCard key={r.id} roleDef={r} />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 28,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.cinzelBold,
    fontSize: 18,
    color: colors.primary,
    marginBottom: 12,
    marginTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  sectionWolves: {
    color: colors.danger,
    borderBottomColor: colors.danger,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardLeft: {
    marginRight: 12,
    justifyContent: "center",
  },
  cardImage: {
    width: 60,
    height: 85,
    borderRadius: 8,
  },
  emojiContainer: {
    width: 60,
    height: 85,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiLarge: {
    fontSize: 36,
  },
  cardRight: {
    flex: 1,
  },
  roleName: {
    fontFamily: fonts.cinzelBold,
    color: colors.text,
    fontSize: 16,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  roleDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
```

- [ ] **Step 2: Add Grimoire button to Home screen**

In `app/index.tsx`, add a "Grimoire" button below the "Nouvelle partie" button:

```typescript
// After the existing Pressable for "Nouvelle partie", add:
<Pressable style={styles.grimoireButton} onPress={() => router.push("/grimoire")}>
  <Text style={styles.grimoireButtonText}>Grimoire des Rôles</Text>
</Pressable>
```

Add to styles:
```typescript
grimoireButton: {
  marginTop: 16,
  paddingHorizontal: 48,
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.primary,
},
grimoireButtonText: {
  color: colors.primary,
  fontSize: 18,
  fontWeight: "bold",
},
```

- [ ] **Step 3: Run tests to ensure no regression**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/grimoire.tsx app/index.tsx
git commit -m "feat: add Grimoire screen and button on home page"
```

---

## Task 8: Refonte de l'écran de paramétrage (`app/roles-setup.tsx`)

**Files:**
- Modify: `app/roles-setup.tsx`

- [ ] **Step 1: Rewrite roles-setup with presets and warnings**

Refondre l'écran pour :
- Importer et utiliser `getPreset` / `getBalanceWarnings` de `game/balance.ts`
- Importer `ROLE_REGISTRY` de `game/roles.ts`
- Initialiser les compteurs avec le preset du nombre de joueurs
- Afficher un badge preset en haut
- Grouper les rôles : Loups / Rôles spéciaux / Villageois (lecture seule)
- Afficher les warnings d'équilibrage en orange
- Garder le timer de débat inchangé

Les rôles spéciaux à afficher (dans l'ordre) :
`seer`, `witch`, `hunter`, `cupid`, `little_girl`, `savior`, `elder`, `raven`, `village_idiot`

Le code complet suit les patterns existants de l'écran actuel (StyleSheet, ImageBackground, Pressable, etc.) avec les ajouts décrits dans la spec. Voir l'implémentation en suivant la structure actuelle de `roles-setup.tsx` en l'étendant avec les nouveaux rôles depuis `ROLE_REGISTRY`, le preset initial via `getPreset(playerCount)`, et la zone de warnings.

- [ ] **Step 2: Run tests**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/roles-setup.tsx
git commit -m "feat: rewrite roles-setup with presets, balance warnings, and 6 new roles"
```

---

## Task 9: Nouveaux steps de nuit (`app/night.tsx`)

**Files:**
- Modify: `app/night.tsx`

- [ ] **Step 1: Add new night step components**

Ajouter dans `night.tsx` les sous-composants pour les 5 nouveaux steps :

1. **CupidStep** : sélection de 2 joueurs parmi tous les vivants → `SET_LOVERS`
2. **LoversRevealStep** : affiche les 2 amoureux + message couple mixte si applicable → bouton "Compris"
3. **SaviorStep** : sélection d'1 joueur (sauf `lastSaviorTarget` grisé) → `SET_SAVIOR_TARGET`
4. **RavenStep** : sélection d'1 joueur + bouton "Passer" → `SET_RAVEN_TARGET`
5. **LittleGirlStep** : affiche le clue généré (lecture seule) → bouton "Refermer les yeux"

Modifier aussi :
- Mettre à jour `ROLE_LABEL_STRINGS` avec les 6 nouveaux rôles
- Remplacer `getNextNightStep` par les night steps calculés depuis `buildNightSteps`
- Le reducer doit stocker les steps calculés et avancer via un index (`NEXT_NIGHT_STEP` avance l'index)

Chaque step suit le pattern existant : `stepTitle` + `instruction` + `FlatList` ou contenu + `button`.

- [ ] **Step 2: Run tests**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/night.tsx
git commit -m "feat: add Cupidon, Lovers, Savior, Raven, Little Girl night steps"
```

---

## Task 10: Modifications phase de jour (`app/day.tsx`)

**Files:**
- Modify: `app/day.tsx`

- [ ] **Step 1: Update day screen with new mechanics**

Modifications :
1. **Annonce** : enrichir `deadNames` avec cascade amoureux ("X est mort(e) de chagrin") et ancien qui résiste
2. **Marque du Corbeau** : nouveau sous-step entre `announce` et `debate` si `ravenTarget` est non-null. Affiche le message et le nom du joueur marqué.
3. **Vote** : afficher le compteur de départ à 2 pour le joueur marqué par le Corbeau
4. **Résolution du vote** : utiliser `resolveVote()` depuis `game/resolution.ts`. Gérer les cas :
   - Idiot du Village survit → écran spécial
   - Ancien tué → message perte de pouvoirs
   - Cascade amoureux → message de chagrin
   - Chasseur → redirection vers `/hunter`

Le `DayStep` type devient : `"announce" | "raven_mark" | "debate" | "vote" | "vote_result"`.

Un nouveau sous-écran `vote_result` affiche les conséquences du vote (idiot survit, ancien tué, amoureux meurt) avant de passer à la nuit suivante.

- [ ] **Step 2: Run tests**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/day.tsx
git commit -m "feat: add Raven mark, Village Idiot survival, Elder power loss, and Lovers cascade to day phase"
```

---

## Task 11: Écran de fin — victoire Amoureux (`app/end.tsx`)

**Files:**
- Modify: `app/end.tsx`

- [ ] **Step 1: Add lovers victory case**

Modifier `EndScreen` pour gérer le 3ème cas de victoire `"lovers"` :

```typescript
// Après les variables existantes, ajouter :
const isLoversWin = state.winner === "lovers";

// Dans le JSX, modifier le titre et l'emoji :
// Si isLoversWin: emoji "💘", titre "Victoire de l'Amour"
// message: les noms des 2 amoureux + "ont survécu ensemble contre tous"

// Trouver les noms des amoureux :
const loverNames = state.lovers
  ? state.lovers.map((id) => state.players.find((p) => p.id === id)?.name)
  : [];
```

Le `CardFrame` titre change selon le cas : "Victoire des Loups" / "Victoire du Village" / "Victoire de l'Amour".

- [ ] **Step 2: Run tests**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/end.tsx
git commit -m "feat: add lovers victory screen to end phase"
```

---

## Task 12: Mettre à jour la distribution et le hunter

**Files:**
- Modify: `app/distribution.tsx`
- Modify: `app/hunter.tsx`

- [ ] **Step 1: Update distribution screen**

Dans `distribution.tsx` :
- Mettre à jour le `ROLE_LABEL_STRINGS` ou le remplacer par l'import de `ROLE_LABELS` (déjà importé, juste vérifier que les nouveaux rôles sont couverts via le update de `theme/roleCards.ts` fait au Task 6).
- Le fallback card (emoji + label) fonctionne déjà pour les rôles sans image.

Aucune modification structurelle nécessaire si `ROLE_LABELS` et `ROLE_CARDS` sont correctement mis à jour (fait au Task 6).

- [ ] **Step 2: Update hunter screen for lovers cascade**

Dans `hunter.tsx`, après le tir du chasseur, le reducer gère déjà la cascade via `HUNTER_SHOOT`. Mais il faut vérifier que si le chasseur tire sur un amoureux, la cascade amoureux est bien gérée dans le reducer (Task 5).

Si l'Ancien a été tué par le village et que `elderKilledByVillage` est true, le chasseur ne tire plus (passif perdu). Modifier `hunter.tsx` pour vérifier ce cas et rediriger directement sans tir.

```typescript
// En haut du composant, après les variables existantes :
const elderPowerLost = state.elderKilledByVillage;

// Si elderPowerLost, ne pas afficher l'écran de tir mais juste passer
useEffect(() => {
  if (elderPowerLost) {
    // Le chasseur a perdu son pouvoir, transition directe
    if (state.hunterContext === "night") {
      dispatch({ type: "START_DAY" });
    } else {
      dispatch({ type: "START_NIGHT" });
    }
  }
}, [elderPowerLost]);
```

- [ ] **Step 3: Run tests**

Run: `npx jest --no-cache`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/distribution.tsx app/hunter.tsx
git commit -m "feat: update distribution for new roles and hunter for elder power loss"
```

---

## Task 13: Tests d'intégration finaux

**Files:**
- All test files

- [ ] **Step 1: Run the full test suite**

Run: `npx jest --no-cache --verbose`
Expected: ALL PASS

- [ ] **Step 2: Fix any failures**

Corriger les éventuels problèmes de typage ou de logique détectés.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "test: fix any remaining test issues after full feature integration"
```

---

## Annexe A: Code complet `context/GameContext.tsx` (Task 5)

```typescript
import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { type Role } from "../game/roles";
import { type NightStep, buildNightSteps } from "../game/nightEngine";
import { resolveNight as resolveNightFn, resolveVote as resolveVoteFn, generateLittleGirlClue } from "../game/resolution";

// Re-export for consumers
export type { Role } from "../game/roles";
export type { NightStep } from "../game/nightEngine";

export interface Player {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
}

export type GamePhase =
  | "setup_players"
  | "setup_roles"
  | "distribution"
  | "night"
  | "day"
  | "hunter"
  | "end";

export interface NightActions {
  werewolvesTarget: string | null;
  seerTarget: string | null;
  witchHeal: boolean;
  witchKill: string | null;
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  turn: number;
  nightStep: NightStep;
  nightSteps: NightStep[];
  nightStepIndex: number;
  nightActions: NightActions;
  witchPotions: { life: boolean; death: boolean };
  winner: "werewolves" | "villagers" | "lovers" | null;
  debateTimerMinutes: number;
  selectedRoles: { role: Role; count: number }[];
  distributionIndex: number;
  revealedRole: boolean;
  nightDeaths: string[];
  hunterContext: "night" | "day" | null;
  // New fields
  lovers: [string, string] | null;
  saviorTarget: string | null;
  lastSaviorTarget: string | null;
  elderLives: number;
  ravenTarget: string | null;
  littleGirlClue: string[] | null;
  villageIdiotRevealed: boolean;
  isFirstNight: boolean;
  elderKilledByVillage: boolean;
}

const emptyNightActions: NightActions = {
  werewolvesTarget: null,
  seerTarget: null,
  witchHeal: false,
  witchKill: null,
};

export const initialState: GameState = {
  players: [],
  phase: "setup_players",
  turn: 0,
  nightStep: "intro",
  nightSteps: [],
  nightStepIndex: 0,
  nightActions: { ...emptyNightActions },
  witchPotions: { life: true, death: true },
  winner: null,
  debateTimerMinutes: 5,
  selectedRoles: [],
  distributionIndex: 0,
  revealedRole: false,
  nightDeaths: [],
  hunterContext: null,
  lovers: null,
  saviorTarget: null,
  lastSaviorTarget: null,
  elderLives: 2,
  ravenTarget: null,
  littleGirlClue: null,
  villageIdiotRevealed: false,
  isFirstNight: true,
  elderKilledByVillage: false,
};

export type GameAction =
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "SET_ROLES"; roles: { role: Role; count: number }[] }
  | { type: "SET_TIMER"; minutes: number }
  | { type: "START_DISTRIBUTION" }
  | { type: "REVEAL_ROLE" }
  | { type: "NEXT_PLAYER" }
  | { type: "START_NIGHT" }
  | { type: "SET_WEREWOLF_TARGET"; playerId: string }
  | { type: "SET_SEER_TARGET"; playerId: string }
  | { type: "SET_WITCH_HEAL"; heal: boolean }
  | { type: "SET_WITCH_KILL"; playerId: string | null }
  | { type: "NEXT_NIGHT_STEP" }
  | { type: "RESOLVE_NIGHT" }
  | { type: "START_DAY" }
  | { type: "VOTE_ELIMINATE"; playerId: string }
  | { type: "HUNTER_SHOOT"; playerId: string }
  | { type: "CHECK_WINNER" }
  | { type: "RESET_GAME" }
  | { type: "SET_LOVERS"; player1Id: string; player2Id: string }
  | { type: "SET_SAVIOR_TARGET"; playerId: string }
  | { type: "SET_RAVEN_TARGET"; playerId: string | null }
  | { type: "SET_LITTLE_GIRL_CLUE"; clue: string[] };

export function checkWinner(
  players: Player[],
  lovers: [string, string] | null = null
): "werewolves" | "villagers" | "lovers" | null {
  const alivePlayers = players.filter((p) => p.isAlive);

  // Lovers win: mixed couple are the only 2 survivors
  if (lovers && alivePlayers.length === 2) {
    const [l1, l2] = lovers;
    const lover1Alive = alivePlayers.some((p) => p.id === l1);
    const lover2Alive = alivePlayers.some((p) => p.id === l2);
    if (lover1Alive && lover2Alive) {
      const lover1 = players.find((p) => p.id === l1);
      const lover2 = players.find((p) => p.id === l2);
      const isMixed =
        (lover1?.role === "werewolf" && lover2?.role !== "werewolf") ||
        (lover2?.role === "werewolf" && lover1?.role !== "werewolf");
      if (isMixed) return "lovers";
    }
  }

  const aliveWolves = alivePlayers.filter((p) => p.role === "werewolf").length;
  const aliveVillagers = alivePlayers.filter((p) => p.role !== "werewolf").length;

  if (aliveWolves === 0) return "villagers";
  if (aliveWolves >= aliveVillagers) return "werewolves";
  return null;
}

export function assignRoles(
  players: Player[],
  selectedRoles: { role: Role; count: number }[]
): Player[] {
  const rolePool: Role[] = [];
  for (const { role, count } of selectedRoles) {
    for (let i = 0; i < count; i++) {
      rolePool.push(role);
    }
  }
  const shuffled = [...rolePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return players.map((p, idx) => ({ ...p, role: shuffled[idx] }));
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADD_PLAYER": {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: action.name.trim(),
        role: null,
        isAlive: true,
      };
      return { ...state, players: [...state.players, newPlayer] };
    }

    case "REMOVE_PLAYER":
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
      };

    case "SET_ROLES":
      return { ...state, selectedRoles: action.roles };

    case "SET_TIMER":
      return { ...state, debateTimerMinutes: action.minutes };

    case "START_DISTRIBUTION": {
      const assigned = assignRoles(state.players, state.selectedRoles);
      return {
        ...state,
        players: assigned,
        phase: "distribution",
        distributionIndex: 0,
        revealedRole: false,
      };
    }

    case "REVEAL_ROLE":
      return { ...state, revealedRole: true };

    case "NEXT_PLAYER": {
      const nextIndex = state.distributionIndex + 1;
      if (nextIndex >= state.players.length) {
        const steps = buildNightSteps(state.players, true, 1, false);
        return {
          ...state,
          phase: "night",
          nightStep: steps[0],
          nightSteps: steps,
          nightStepIndex: 0,
          turn: 1,
          isFirstNight: true,
        };
      }
      return {
        ...state,
        distributionIndex: nextIndex,
        revealedRole: false,
      };
    }

    case "START_NIGHT": {
      const steps = buildNightSteps(
        state.players,
        state.isFirstNight,
        state.turn,
        state.elderKilledByVillage
      );
      return {
        ...state,
        phase: "night",
        nightStep: steps[0],
        nightSteps: steps,
        nightStepIndex: 0,
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
        saviorTarget: null,
        ravenTarget: null,
        littleGirlClue: null,
      };
    }

    case "SET_WEREWOLF_TARGET":
      return {
        ...state,
        nightActions: { ...state.nightActions, werewolvesTarget: action.playerId },
      };

    case "SET_SEER_TARGET":
      return {
        ...state,
        nightActions: { ...state.nightActions, seerTarget: action.playerId },
      };

    case "SET_WITCH_HEAL":
      return {
        ...state,
        nightActions: { ...state.nightActions, witchHeal: action.heal },
      };

    case "SET_WITCH_KILL":
      return {
        ...state,
        nightActions: { ...state.nightActions, witchKill: action.playerId },
      };

    case "SET_LOVERS":
      return {
        ...state,
        lovers: [action.player1Id, action.player2Id],
      };

    case "SET_SAVIOR_TARGET":
      return { ...state, saviorTarget: action.playerId };

    case "SET_RAVEN_TARGET":
      return { ...state, ravenTarget: action.playerId };

    case "SET_LITTLE_GIRL_CLUE":
      return { ...state, littleGirlClue: action.clue };

    case "NEXT_NIGHT_STEP": {
      const nextIndex = state.nightStepIndex + 1;
      if (nextIndex >= state.nightSteps.length) return state;

      const nextStep = state.nightSteps[nextIndex];

      // Auto-generate little girl clue when entering that step
      let clue = state.littleGirlClue;
      if (nextStep === "little_girl") {
        clue = generateLittleGirlClue(state.players);
      }

      return {
        ...state,
        nightStepIndex: nextIndex,
        nightStep: nextStep,
        littleGirlClue: clue,
      };
    }

    case "RESOLVE_NIGHT": {
      const resolution = resolveNightFn({
        players: state.players,
        nightActions: state.nightActions,
        witchPotions: state.witchPotions,
        saviorTarget: state.saviorTarget,
        elderLives: state.elderLives,
        lovers: state.lovers,
        elderKilledByVillage: state.elderKilledByVillage,
      });

      let updatedPlayers = state.players.map((p) =>
        resolution.deaths.includes(p.id) ? { ...p, isAlive: false } : p
      );

      const winner = checkWinner(updatedPlayers, state.lovers);

      if (resolution.hunterTriggered && !winner && !state.elderKilledByVillage) {
        return {
          ...state,
          players: updatedPlayers,
          witchPotions: resolution.updatedPotions,
          elderLives: resolution.newElderLives,
          nightDeaths: resolution.deaths,
          phase: "hunter",
          hunterContext: "night",
          lastSaviorTarget: state.saviorTarget,
          isFirstNight: false,
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        witchPotions: resolution.updatedPotions,
        elderLives: resolution.newElderLives,
        nightDeaths: resolution.deaths,
        phase: winner ? "end" : "day",
        winner,
        lastSaviorTarget: state.saviorTarget,
        isFirstNight: false,
      };
    }

    case "START_DAY":
      return { ...state, phase: "day" };

    case "VOTE_ELIMINATE": {
      const resolution = resolveVoteFn(
        {
          players: state.players,
          lovers: state.lovers,
          villageIdiotRevealed: state.villageIdiotRevealed,
          elderKilledByVillage: state.elderKilledByVillage,
        },
        action.playerId
      );

      // Village Idiot survived
      if (resolution.villageIdiotSurvived) {
        return {
          ...state,
          villageIdiotRevealed: true,
        };
      }

      const updatedPlayers = state.players.map((p) =>
        resolution.deaths.includes(p.id) ? { ...p, isAlive: false } : p
      );

      const winner = checkWinner(updatedPlayers, state.lovers);

      if (resolution.hunterTriggered && !winner && !resolution.elderKilledByVillage) {
        return {
          ...state,
          players: updatedPlayers,
          phase: "hunter",
          hunterContext: "day",
          elderKilledByVillage: resolution.elderKilledByVillage,
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        phase: winner ? "end" : "night",
        nightStep: "intro",
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
        turn: winner ? state.turn : state.turn + 1,
        winner,
        elderKilledByVillage: resolution.elderKilledByVillage,
      };
    }

    case "HUNTER_SHOOT": {
      let updatedPlayers = state.players.map((p) =>
        p.id === action.playerId ? { ...p, isAlive: false } : p
      );

      // Lovers cascade on hunter shot
      if (state.lovers) {
        const [l1, l2] = state.lovers;
        if (action.playerId === l1 || action.playerId === l2) {
          const otherId = action.playerId === l1 ? l2 : l1;
          updatedPlayers = updatedPlayers.map((p) =>
            p.id === otherId ? { ...p, isAlive: false } : p
          );
        }
      }

      const winner = checkWinner(updatedPlayers, state.lovers);

      if (winner) {
        return { ...state, players: updatedPlayers, phase: "end", winner };
      }

      if (state.hunterContext === "night") {
        return {
          ...state,
          players: updatedPlayers,
          phase: "day",
          hunterContext: null,
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        phase: "night",
        nightStep: "intro",
        nightActions: { ...emptyNightActions },
        nightDeaths: [],
        turn: state.turn + 1,
        hunterContext: null,
      };
    }

    case "CHECK_WINNER": {
      const winner = checkWinner(state.players, state.lovers);
      if (winner) {
        return { ...state, phase: "end", winner };
      }
      return state;
    }

    case "RESET_GAME":
      return { ...initialState };

    default:
      return state;
  }
}

// --- Context ---

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
```

---

## Annexe B: Tests mis à jour `__tests__/gameReducer.test.ts` (Task 5)

```typescript
import {
  checkWinner,
  gameReducer,
  initialState,
  GameState,
  Player,
} from "../context/GameContext";
import type { Role } from "../game/roles";

function makePlayer(
  id: string,
  name: string,
  role: Role,
  isAlive = true
): Player {
  return { id, name, role, isAlive };
}

describe("checkWinner", () => {
  it("returns 'villagers' when all werewolves are dead", () => {
    const players: Player[] = [
      makePlayer("1", "Alice", "werewolf", false),
      makePlayer("2", "Bob", "villager", true),
      makePlayer("3", "Charlie", "seer", true),
    ];
    expect(checkWinner(players)).toBe("villagers");
  });

  it("returns 'werewolves' when wolves >= villagers", () => {
    const players: Player[] = [
      makePlayer("1", "Alice", "werewolf", true),
      makePlayer("2", "Bob", "villager", true),
      makePlayer("3", "Charlie", "seer", false),
    ];
    expect(checkWinner(players)).toBe("werewolves");
  });

  it("returns null when game is still ongoing", () => {
    const players: Player[] = [
      makePlayer("1", "Alice", "werewolf", true),
      makePlayer("2", "Bob", "villager", true),
      makePlayer("3", "Charlie", "seer", true),
    ];
    expect(checkWinner(players)).toBeNull();
  });

  it("returns 'lovers' when mixed couple are last 2 alive", () => {
    const players: Player[] = [
      makePlayer("1", "Wolf", "werewolf", true),
      makePlayer("2", "Lover", "villager", true),
      makePlayer("3", "Dead", "villager", false),
    ];
    expect(checkWinner(players, ["1", "2"])).toBe("lovers");
  });

  it("returns 'werewolves' for same-camp couple (both wolves scenario)", () => {
    const players: Player[] = [
      makePlayer("1", "Wolf1", "werewolf", true),
      makePlayer("2", "Wolf2", "werewolf", true),
      makePlayer("3", "Dead", "villager", false),
    ];
    // Not a mixed couple, so normal win condition
    expect(checkWinner(players, ["1", "2"])).toBe("werewolves");
  });
});

describe("gameReducer", () => {
  describe("ADD_PLAYER", () => {
    it("adds a player to the list", () => {
      const state = gameReducer(initialState, {
        type: "ADD_PLAYER",
        name: "Alice",
      });
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe("Alice");
      expect(state.players[0].isAlive).toBe(true);
      expect(state.players[0].role).toBeNull();
    });
  });

  describe("REMOVE_PLAYER", () => {
    it("removes a player by id", () => {
      let state = gameReducer(initialState, {
        type: "ADD_PLAYER",
        name: "Alice",
      });
      const id = state.players[0].id;
      state = gameReducer(state, { type: "REMOVE_PLAYER", id });
      expect(state.players).toHaveLength(0);
    });
  });

  describe("SET_TIMER", () => {
    it("sets the debate timer", () => {
      const state = gameReducer(initialState, {
        type: "SET_TIMER",
        minutes: 3,
      });
      expect(state.debateTimerMinutes).toBe(3);
    });
  });

  describe("SET_LOVERS", () => {
    it("sets the lovers pair", () => {
      const state = gameReducer(initialState, {
        type: "SET_LOVERS",
        player1Id: "1",
        player2Id: "2",
      });
      expect(state.lovers).toEqual(["1", "2"]);
    });
  });

  describe("SET_SAVIOR_TARGET", () => {
    it("sets the savior target", () => {
      const state = gameReducer(initialState, {
        type: "SET_SAVIOR_TARGET",
        playerId: "3",
      });
      expect(state.saviorTarget).toBe("3");
    });
  });

  describe("SET_RAVEN_TARGET", () => {
    it("sets the raven target", () => {
      const state = gameReducer(initialState, {
        type: "SET_RAVEN_TARGET",
        playerId: "4",
      });
      expect(state.ravenTarget).toBe("4");
    });

    it("can be set to null (pass)", () => {
      const state = gameReducer(initialState, {
        type: "SET_RAVEN_TARGET",
        playerId: null,
      });
      expect(state.ravenTarget).toBeNull();
    });
  });

  describe("RESOLVE_NIGHT", () => {
    it("kills werewolf target when witch does not heal", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Victim", "villager"),
          makePlayer("3", "Other", "villager"),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };
      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.nightDeaths).toContain("2");
    });

    it("saves werewolf target when witch heals", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Victim", "villager"),
          makePlayer("3", "Other", "villager"),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: true,
          witchKill: null,
        },
        witchPotions: { life: true, death: true },
        phase: "night",
      };
      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.witchPotions.life).toBe(false);
    });

    it("kills lovers in cascade", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "L1", "villager"),
          makePlayer("3", "L2", "seer"),
          makePlayer("4", "Other", "villager"),
        ],
        lovers: ["2", "3"],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };
      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.players.find((p) => p.id === "3")?.isAlive).toBe(false);
    });

    it("savior protects target from wolves", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Protected", "villager"),
          makePlayer("3", "Other", "villager"),
        ],
        saviorTarget: "2",
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };
      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
    });

    it("elder survives first wolf attack", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Elder", "elder"),
          makePlayer("3", "Other", "villager"),
        ],
        elderLives: 2,
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };
      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.elderLives).toBe(1);
    });

    it("triggers hunter screen when hunter is killed at night", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Hunter", "hunter"),
          makePlayer("3", "Other", "villager"),
          makePlayer("4", "Other2", "villager"),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        phase: "night",
      };
      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.phase).toBe("hunter");
      expect(result.hunterContext).toBe("night");
    });
  });

  describe("VOTE_ELIMINATE", () => {
    it("eliminates voted player and checks victory", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Villager", "villager"),
          makePlayer("3", "Other", "villager"),
        ],
        phase: "day",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "1",
      });
      expect(result.players.find((p) => p.id === "1")?.isAlive).toBe(false);
      expect(result.winner).toBe("villagers");
      expect(result.phase).toBe("end");
    });

    it("village idiot survives first vote", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Idiot", "village_idiot"),
          makePlayer("3", "Other", "villager"),
        ],
        villageIdiotRevealed: false,
        phase: "day",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "2",
      });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.villageIdiotRevealed).toBe(true);
    });

    it("elder kill triggers power loss", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Elder", "elder"),
          makePlayer("3", "Other", "villager"),
          makePlayer("4", "Other2", "villager"),
        ],
        phase: "day",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "2",
      });
      expect(result.elderKilledByVillage).toBe(true);
    });

    it("triggers hunter when hunter is voted out", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Hunter", "hunter"),
          makePlayer("3", "V1", "villager"),
          makePlayer("4", "V2", "villager"),
        ],
        phase: "day",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "2",
      });
      expect(result.phase).toBe("hunter");
      expect(result.hunterContext).toBe("day");
    });
  });

  describe("HUNTER_SHOOT", () => {
    it("hunter kills target and checks victory", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "V1", "villager"),
        ],
        phase: "hunter",
        hunterContext: "day",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "HUNTER_SHOOT",
        playerId: "1",
      });
      expect(result.players.find((p) => p.id === "1")?.isAlive).toBe(false);
      expect(result.winner).toBe("villagers");
      expect(result.phase).toBe("end");
    });

    it("hunter shoot triggers lovers cascade", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "L1", "villager"),
          makePlayer("4", "L2", "villager"),
          makePlayer("5", "Other", "villager"),
        ],
        lovers: ["3", "4"],
        phase: "hunter",
        hunterContext: "night",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "HUNTER_SHOOT",
        playerId: "3",
      });
      expect(result.players.find((p) => p.id === "3")?.isAlive).toBe(false);
      expect(result.players.find((p) => p.id === "4")?.isAlive).toBe(false);
    });

    it("continues to day after night hunter shoot if no winner", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf"),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "V1", "villager"),
          makePlayer("4", "V2", "villager"),
          makePlayer("5", "V3", "villager"),
        ],
        phase: "hunter",
        hunterContext: "night",
        turn: 1,
      };
      const result = gameReducer(state, {
        type: "HUNTER_SHOOT",
        playerId: "3",
      });
      expect(result.phase).toBe("day");
      expect(result.hunterContext).toBeNull();
    });
  });

  describe("RESET_GAME", () => {
    it("resets to initial state", () => {
      const modifiedState: GameState = {
        ...initialState,
        players: [makePlayer("1", "A", "werewolf")],
        phase: "night",
        turn: 3,
      };
      const result = gameReducer(modifiedState, { type: "RESET_GAME" });
      expect(result).toEqual(initialState);
    });
  });
});
```

---

## Ordre d'exécution

```
Task 1 (roles.ts) ──┐
Task 2 (balance.ts) ─┤── Modules indépendants, parallélisables
Task 3 (nightEngine) ┤
Task 4 (resolution) ─┘
         │
Task 5 (GameContext) ── Dépend de 1-4
         │
Task 6 (roleCards) ──── Dépend de 1
         │
    ┌────┴────┐
Task 7      Task 8 ── Parallélisables (roles-setup / grimoire+home)
    └────┬────┘
         │
    ┌────┴────┐
Task 9      Task 10 ── Parallélisables (night.tsx / day.tsx)
    └────┬────┘
         │
    ┌────┴────┐
Task 11    Task 12 ── Parallélisables (end.tsx / distribution+hunter)
    └────┬────┘
         │
      Task 13 ── Tests d'intégration finaux
```
