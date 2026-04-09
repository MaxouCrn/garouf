import { resolveNight, resolveVote, generateLittleGirlClue } from "../game/resolution";
import { Role } from "../game/roles";

type PlayerLike = { id: string; role: Role | null; isAlive: boolean };

function makePlayer(id: string, role: Role | null, isAlive = true): PlayerLike {
  return { id, role, isAlive };
}

// ── resolveNight ────────────────────────────────────────────────────────────

describe("resolveNight", () => {
  const baseInput = {
    nightActions: { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null },
    witchPotions: { life: true, death: true },
    saviorTarget: null,
    elderLives: 2,
    lovers: null as [string, string] | null,
    elderKilledByVillage: false,
  };

  it("kills the werewolf target normally", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("victim", "villager"),
    ];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "victim" },
    });
    expect(result.deaths).toContain("victim");
    expect(result.savedByWitch).toBe(false);
    expect(result.savedBySavior).toBe(false);
  });

  it("savior protects the target", () => {
    const players = [makePlayer("wolf", "werewolf"), makePlayer("victim", "villager")];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "victim" },
      saviorTarget: "victim",
    });
    expect(result.deaths).not.toContain("victim");
    expect(result.savedBySavior).toBe(true);
    expect(result.deaths).toHaveLength(0);
  });

  it("elder survives first werewolf attack (loses one life)", () => {
    const players = [makePlayer("wolf", "werewolf"), makePlayer("elder", "elder")];
    const result = resolveNight({
      ...baseInput,
      players,
      elderLives: 2,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "elder" },
    });
    expect(result.deaths).not.toContain("elder");
    expect(result.elderLostLife).toBe(true);
    expect(result.newElderLives).toBe(1);
  });

  it("elder dies on second attack (elderLives === 1)", () => {
    const players = [makePlayer("wolf", "werewolf"), makePlayer("elder", "elder")];
    const result = resolveNight({
      ...baseInput,
      players,
      elderLives: 1,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "elder" },
    });
    expect(result.deaths).toContain("elder");
    expect(result.elderLostLife).toBe(false);
  });

  it("witch heals the werewolf target", () => {
    const players = [makePlayer("wolf", "werewolf"), makePlayer("victim", "villager")];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "victim", witchHeal: true },
      witchPotions: { life: true, death: true },
    });
    expect(result.deaths).not.toContain("victim");
    expect(result.savedByWitch).toBe(true);
    expect(result.updatedPotions.life).toBe(false);
  });

  it("witch heal does not apply when savior already saved (savedBySavior=true)", () => {
    // witchHeal is set but savior already saved → witch potion should NOT be consumed
    const players = [makePlayer("wolf", "werewolf"), makePlayer("victim", "villager")];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "victim", witchHeal: true },
      saviorTarget: "victim",
      witchPotions: { life: true, death: true },
    });
    expect(result.deaths).not.toContain("victim");
    expect(result.savedBySavior).toBe(true);
    expect(result.savedByWitch).toBe(false);
    // life potion NOT consumed because savior already handled the save
    expect(result.updatedPotions.life).toBe(true);
  });

  it("witch poisons a player independently", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("victim", "villager"),
      makePlayer("poisoned", "seer"),
    ];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: {
        werewolvesTarget: "victim",
        seerTarget: null,
        witchHeal: false,
        witchKill: "poisoned",
      },
      witchPotions: { life: true, death: true },
    });
    expect(result.deaths).toContain("victim");
    expect(result.deaths).toContain("poisoned");
    expect(result.updatedPotions.death).toBe(false);
  });

  it("savior does NOT block witch poison", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("poisoned", "villager"),
    ];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: {
        werewolvesTarget: null,
        seerTarget: null,
        witchHeal: false,
        witchKill: "poisoned",
      },
      saviorTarget: "poisoned",
      witchPotions: { life: true, death: true },
    });
    expect(result.deaths).toContain("poisoned");
    expect(result.savedBySavior).toBe(false);
  });

  it("lovers cascade: when one lover dies, the other dies too", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("loverA", "villager"),
      makePlayer("loverB", "seer"),
    ];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "loverA" },
      lovers: ["loverA", "loverB"],
    });
    expect(result.deaths).toContain("loverA");
    expect(result.loversCascade).toBe("loverB");
  });

  it("hunters trigger when hunter is killed at night", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("hunter", "hunter"),
    ];
    const result = resolveNight({
      ...baseInput,
      players,
      nightActions: { ...baseInput.nightActions, werewolvesTarget: "hunter" },
    });
    expect(result.deaths).toContain("hunter");
    expect(result.hunterTriggered).toBe(true);
  });

  it("no deaths when no target", () => {
    const players = [makePlayer("wolf", "werewolf"), makePlayer("v1", "villager")];
    const result = resolveNight({ ...baseInput, players });
    expect(result.deaths).toHaveLength(0);
    expect(result.hunterTriggered).toBe(false);
  });
});

// ── resolveVote ─────────────────────────────────────────────────────────────

describe("resolveVote", () => {
  it("normal kill: player dies", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("villager", "villager"),
      makePlayer("v2", "villager"),
    ];
    const result = resolveVote(
      { players, lovers: null, villageIdiotRevealed: false, elderKilledByVillage: false },
      "villager"
    );
    expect(result.deaths).toContain("villager");
    expect(result.villageIdiotSurvived).toBe(false);
  });

  it("village idiot survives first vote (not yet revealed)", () => {
    const players = [
      makePlayer("idiot", "village_idiot"),
      makePlayer("wolf", "werewolf"),
      makePlayer("v1", "villager"),
    ];
    const result = resolveVote(
      { players, lovers: null, villageIdiotRevealed: false, elderKilledByVillage: false },
      "idiot"
    );
    expect(result.deaths).toHaveLength(0);
    expect(result.villageIdiotSurvived).toBe(true);
  });

  it("village idiot dies if already revealed", () => {
    const players = [
      makePlayer("idiot", "village_idiot"),
      makePlayer("wolf", "werewolf"),
      makePlayer("v1", "villager"),
    ];
    const result = resolveVote(
      { players, lovers: null, villageIdiotRevealed: true, elderKilledByVillage: false },
      "idiot"
    );
    expect(result.deaths).toContain("idiot");
    expect(result.villageIdiotSurvived).toBe(false);
  });

  it("elder kill sets elderKilledByVillage=true", () => {
    const players = [
      makePlayer("elder", "elder"),
      makePlayer("wolf", "werewolf"),
      makePlayer("v1", "villager"),
    ];
    const result = resolveVote(
      { players, lovers: null, villageIdiotRevealed: false, elderKilledByVillage: false },
      "elder"
    );
    expect(result.deaths).toContain("elder");
    expect(result.elderKilledByVillage).toBe(true);
  });

  it("lovers cascade on vote", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("loverA", "villager"),
      makePlayer("loverB", "seer"),
    ];
    const result = resolveVote(
      { players, lovers: ["loverA", "loverB"], villageIdiotRevealed: false, elderKilledByVillage: false },
      "loverA"
    );
    expect(result.deaths).toContain("loverA");
    expect(result.loversCascade).toBe("loverB");
  });

  it("hunter triggers when hunter is voted out", () => {
    const players = [
      makePlayer("wolf", "werewolf"),
      makePlayer("hunter", "hunter"),
      makePlayer("v1", "villager"),
      makePlayer("v2", "villager"),
    ];
    const result = resolveVote(
      { players, lovers: null, villageIdiotRevealed: false, elderKilledByVillage: false },
      "hunter"
    );
    expect(result.deaths).toContain("hunter");
    expect(result.hunterTriggered).toBe(true);
  });
});

// ── generateLittleGirlClue ──────────────────────────────────────────────────

describe("generateLittleGirlClue", () => {
  const players: PlayerLike[] = [
    makePlayer("wolf1", "werewolf"),
    makePlayer("wolf2", "werewolf"),
    makePlayer("v1", "villager"),
    makePlayer("v2", "villager"),
    makePlayer("seer", "seer"),
    makePlayer("lg", "little_girl"),
  ];

  it("returns 2 or 3 player IDs", () => {
    for (let i = 0; i < 20; i++) {
      const clues = generateLittleGirlClue(players);
      expect(clues.length).toBeGreaterThanOrEqual(2);
      expect(clues.length).toBeLessThanOrEqual(3);
    }
  });

  it("always includes at least one wolf", () => {
    const wolves = new Set(["wolf1", "wolf2"]);
    for (let i = 0; i < 20; i++) {
      const clues = generateLittleGirlClue(players);
      const hasWolf = clues.some((id) => wolves.has(id));
      expect(hasWolf).toBe(true);
    }
  });

  it("never includes little_girl herself", () => {
    for (let i = 0; i < 20; i++) {
      const clues = generateLittleGirlClue(players);
      expect(clues).not.toContain("lg");
    }
  });

  it("only includes alive players", () => {
    const playersWithDead: PlayerLike[] = [
      makePlayer("wolf1", "werewolf", false),
      makePlayer("wolf2", "werewolf", true),
      makePlayer("v1", "villager", true),
      makePlayer("v2", "villager", true),
      makePlayer("lg", "little_girl", true),
    ];
    for (let i = 0; i < 20; i++) {
      const clues = generateLittleGirlClue(playersWithDead);
      expect(clues).not.toContain("wolf1");
    }
  });
});
