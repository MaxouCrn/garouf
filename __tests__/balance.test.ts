import { getPreset, getBalanceWarnings } from "../game/balance";
import type { Role } from "../game/roles";

function makeEmptyComposition(): Record<Role, number> {
  return {
    werewolf: 0,
    villager: 0,
    seer: 0,
    witch: 0,
    hunter: 0,
    cupid: 0,
    little_girl: 0,
    savior: 0,
    elder: 0,
    raven: 0,
    village_idiot: 0,
  };
}

describe("getPreset", () => {
  it("returns correct values for 8 players", () => {
    const preset = getPreset(8);
    expect(preset.werewolf).toBe(2);
    expect(preset.seer).toBe(1);
    expect(preset.witch).toBe(1);
    expect(preset.hunter).toBe(1);
    expect(preset.villager).toBe(3);
    expect(preset.cupid).toBe(0);
    expect(preset.little_girl).toBe(0);
    expect(preset.savior).toBe(0);
    expect(preset.elder).toBe(0);
    expect(preset.raven).toBe(0);
    expect(preset.village_idiot).toBe(0);
  });

  it("preset for 10 has 3 wolves and cupid", () => {
    const preset = getPreset(10);
    expect(preset.werewolf).toBe(3);
    expect(preset.cupid).toBe(1);
  });

  it("preset for 14 has 4 wolves, savior, and elder", () => {
    const preset = getPreset(14);
    expect(preset.werewolf).toBe(4);
    expect(preset.savior).toBe(1);
    expect(preset.elder).toBe(1);
  });

  it("all presets from 6 to 18 sum to their player count", () => {
    for (let n = 6; n <= 18; n++) {
      const preset = getPreset(n);
      const total = Object.values(preset).reduce((a, b) => a + b, 0);
      expect(total).toBe(n);
    }
  });

  it("clamps player count below 6 to preset 6", () => {
    expect(getPreset(3)).toEqual(getPreset(6));
    expect(getPreset(1)).toEqual(getPreset(6));
  });

  it("clamps player count above 18 to preset 18", () => {
    expect(getPreset(20)).toEqual(getPreset(18));
    expect(getPreset(100)).toEqual(getPreset(18));
  });
});

describe("getBalanceWarnings", () => {
  it("returns no warnings for the recommended preset", () => {
    for (let n = 6; n <= 18; n++) {
      const preset = getPreset(n);
      const warnings = getBalanceWarnings(n, preset);
      expect(warnings).toHaveLength(0);
    }
  });

  it("warns when there are too many werewolves", () => {
    const composition = { ...getPreset(8), werewolf: 5 };
    const warnings = getBalanceWarnings(8, composition);
    expect(warnings.some((w: string) => w.includes("Loups-Garous"))).toBe(true);
  });

  it("warns when there are no info roles (seer=0 and witch=0)", () => {
    const composition = { ...getPreset(8), seer: 0, witch: 0, villager: 5 };
    const warnings = getBalanceWarnings(8, composition);
    expect(warnings.some((w: string) => w.includes("Voyante") && w.includes("Sorcière"))).toBe(true);
  });

  it("warns when there are not enough villagers (villager < 1)", () => {
    const composition = { ...getPreset(8), villager: 0, seer: 2 };
    const warnings = getBalanceWarnings(8, composition);
    expect(warnings.some((w: string) => w.includes("Villageois"))).toBe(true);
  });

  it("warns when wolf/non-wolf ratio exceeds 0.5", () => {
    // 4 wolves out of 8 → 4/(8-4) = 1.0 > 0.5
    const composition = { ...getPreset(8), werewolf: 4, villager: 1 };
    const warnings = getBalanceWarnings(8, composition);
    expect(warnings.some((w: string) => w.includes("ratio"))).toBe(true);
  });

  it("warns when cupid is present with fewer than 9 players", () => {
    const composition = { ...getPreset(8), cupid: 1, villager: 2 };
    const warnings = getBalanceWarnings(8, composition);
    expect(warnings.some((w: string) => w.includes("Cupidon"))).toBe(true);
  });

  it("does not warn about cupid when player count >= 9", () => {
    const composition = getPreset(9);
    const warnings = getBalanceWarnings(9, composition);
    expect(warnings.some((w: string) => w.includes("Cupidon"))).toBe(false);
  });
});
