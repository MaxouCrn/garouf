import { ROLE_REGISTRY, Role, RoleDefinition } from "../game/roles";

const ALL_ROLES: Role[] = [
  "werewolf",
  "villager",
  "seer",
  "witch",
  "hunter",
  "cupid",
  "little_girl",
  "savior",
  "elder",
  "raven",
  "village_idiot",
];

describe("ROLE_REGISTRY", () => {
  it("contains all 11 roles", () => {
    const registeredRoles = Object.keys(ROLE_REGISTRY) as Role[];
    expect(registeredRoles.sort()).toEqual([...ALL_ROLES].sort());
  });

  it("every role has required fields", () => {
    ALL_ROLES.forEach((role) => {
      const def: RoleDefinition = ROLE_REGISTRY[role];
      expect(def.id).toBe(role);
      expect(typeof def.label).toBe("string");
      expect(def.label.length).toBeGreaterThan(0);
      expect(typeof def.emoji).toBe("string");
      expect(def.emoji.length).toBeGreaterThan(0);
      expect(["village", "werewolves"]).toContain(def.camp);
      expect(typeof def.description).toBe("string");
      expect(def.description.length).toBeGreaterThan(0);
      expect(typeof def.min).toBe("number");
      expect(typeof def.max).toBe("number");
      expect(
        def.nightOrder === null || typeof def.nightOrder === "number"
      ).toBe(true);
      expect(typeof def.firstNightOnly).toBe("boolean");
      expect(typeof def.activeEveryOtherNight).toBe("boolean");
    });
  });

  it("only werewolf is in werewolves camp", () => {
    ALL_ROLES.forEach((role) => {
      if (role === "werewolf") {
        expect(ROLE_REGISTRY[role].camp).toBe("werewolves");
      } else {
        expect(ROLE_REGISTRY[role].camp).toBe("village");
      }
    });
  });

  it("only cupid is firstNightOnly", () => {
    ALL_ROLES.forEach((role) => {
      if (role === "cupid") {
        expect(ROLE_REGISTRY[role].firstNightOnly).toBe(true);
      } else {
        expect(ROLE_REGISTRY[role].firstNightOnly).toBe(false);
      }
    });
  });

  it("only little_girl is activeEveryOtherNight", () => {
    ALL_ROLES.forEach((role) => {
      if (role === "little_girl") {
        expect(ROLE_REGISTRY[role].activeEveryOtherNight).toBe(true);
      } else {
        expect(ROLE_REGISTRY[role].activeEveryOtherNight).toBe(false);
      }
    });
  });

  it("passive roles have null nightOrder", () => {
    const passiveRoles: Role[] = ["villager", "hunter", "elder", "village_idiot"];
    passiveRoles.forEach((role) => {
      expect(ROLE_REGISTRY[role].nightOrder).toBeNull();
    });
  });

  it("werewolf max is 4 and special roles max is 1", () => {
    expect(ROLE_REGISTRY.werewolf.max).toBe(4);
    const specialRoles: Role[] = [
      "seer",
      "witch",
      "hunter",
      "cupid",
      "little_girl",
      "savior",
      "elder",
      "raven",
      "village_idiot",
    ];
    specialRoles.forEach((role) => {
      expect(ROLE_REGISTRY[role].max).toBe(1);
    });
  });
});
