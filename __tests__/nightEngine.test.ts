import { buildNightSteps, NightStep } from "../game/nightEngine";
import { Role } from "../game/roles";

type Player = { role: Role | null; isAlive: boolean };

function makePlayers(...roles: Role[]): Player[] {
  return roles.map((role) => ({ role, isAlive: true }));
}

describe("buildNightSteps", () => {
  test("basic: only werewolves/villagers → intro, werewolves, resolution", () => {
    const players = makePlayers("werewolf", "villager", "villager");
    expect(buildNightSteps(players, false, 1, false)).toEqual([
      "intro",
      "werewolves",
      "resolution",
    ]);
  });

  test("seer+witch alive → intro, seer, werewolves, witch, resolution", () => {
    const players = makePlayers("werewolf", "villager", "seer", "witch");
    expect(buildNightSteps(players, false, 1, false)).toEqual([
      "intro",
      "seer",
      "werewolves",
      "witch",
      "resolution",
    ]);
  });

  test("dead seer is skipped", () => {
    const players: Player[] = [
      { role: "werewolf", isAlive: true },
      { role: "seer", isAlive: false },
    ];
    expect(buildNightSteps(players, false, 1, false)).toEqual([
      "intro",
      "werewolves",
      "resolution",
    ]);
  });

  test("first night with cupid → intro, cupid, lovers_reveal, werewolves, resolution", () => {
    const players = makePlayers("werewolf", "villager", "cupid");
    expect(buildNightSteps(players, true, 1, false)).toEqual([
      "intro",
      "cupid",
      "lovers_reveal",
      "werewolves",
      "resolution",
    ]);
  });

  test("cupid excluded on non-first night", () => {
    const players = makePlayers("werewolf", "villager", "cupid");
    expect(buildNightSteps(players, false, 2, false)).toEqual([
      "intro",
      "werewolves",
      "resolution",
    ]);
  });

  test("savior appears before werewolves", () => {
    const players = makePlayers("werewolf", "villager", "savior");
    const steps = buildNightSteps(players, false, 1, false);
    const saviorIdx = steps.indexOf("savior");
    const werewolvesIdx = steps.indexOf("werewolves");
    expect(saviorIdx).toBeGreaterThanOrEqual(0);
    expect(saviorIdx).toBeLessThan(werewolvesIdx);
  });

  test("raven appears after witch", () => {
    const players = makePlayers("werewolf", "witch", "raven");
    const steps = buildNightSteps(players, false, 1, false);
    const witchIdx = steps.indexOf("witch");
    const ravenIdx = steps.indexOf("raven");
    expect(ravenIdx).toBeGreaterThan(witchIdx);
  });

  test("little_girl on odd turns only", () => {
    const players = makePlayers("werewolf", "little_girl");

    const turn1 = buildNightSteps(players, false, 1, false);
    expect(turn1).toContain("little_girl");

    const turn2 = buildNightSteps(players, false, 2, false);
    expect(turn2).not.toContain("little_girl");

    const turn3 = buildNightSteps(players, false, 3, false);
    expect(turn3).toContain("little_girl");
  });

  test("elderKilledByVillage → only intro, werewolves, resolution even with all roles alive", () => {
    const players = makePlayers(
      "werewolf",
      "seer",
      "witch",
      "savior",
      "raven",
      "little_girl",
      "cupid"
    );
    expect(buildNightSteps(players, true, 1, true)).toEqual([
      "intro",
      "werewolves",
      "resolution",
    ]);
  });

  test("full first night with all roles alive", () => {
    const players = makePlayers(
      "werewolf",
      "cupid",
      "seer",
      "savior",
      "witch",
      "raven",
      "little_girl"
    );
    expect(buildNightSteps(players, true, 1, false)).toEqual([
      "intro",
      "cupid",
      "lovers_reveal",
      "seer",
      "savior",
      "werewolves",
      "witch",
      "raven",
      "little_girl",
      "resolution",
    ]);
  });
});
