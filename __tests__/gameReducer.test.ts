import {
  checkWinner,
  gameReducer,
  initialState,
  GameState,
  Player,
} from "../context/GameContext";
import type { Role } from "../game/roles";
import type { NightStep } from "../game/nightEngine";

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

  it("returns 'lovers' for mixed couple as last 2 alive", () => {
    const players: Player[] = [
      makePlayer("1", "Wolf", "werewolf", true),
      makePlayer("2", "Villager", "villager", true),
      makePlayer("3", "Dead", "seer", false),
    ];
    expect(checkWinner(players, ["1", "2"])).toBe("lovers");
  });

  it("returns 'werewolves' for same-camp couple (both wolves scenario)", () => {
    // Two wolves alive, they are lovers but same camp -> normal win check
    const players: Player[] = [
      makePlayer("1", "Wolf1", "werewolf", true),
      makePlayer("2", "Wolf2", "werewolf", true),
      makePlayer("3", "Dead", "villager", false),
    ];
    // Both wolves, not mixed -> no lovers win, werewolves win
    expect(checkWinner(players, ["1", "2"])).toBe("werewolves");
  });

  it("returns 'villagers' for same-camp couple (both villagers scenario)", () => {
    const players: Player[] = [
      makePlayer("1", "V1", "villager", true),
      makePlayer("2", "V2", "seer", true),
      makePlayer("3", "Dead", "werewolf", false),
    ];
    // Both villagers, not mixed -> no lovers win, villagers win
    expect(checkWinner(players, ["1", "2"])).toBe("villagers");
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
    it("sets lovers pair", () => {
      const state = gameReducer(initialState, {
        type: "SET_LOVERS",
        player1Id: "1",
        player2Id: "2",
      });
      expect(state.lovers).toEqual(["1", "2"]);
    });
  });

  describe("SET_SAVIOR_TARGET", () => {
    it("sets savior target", () => {
      const state = gameReducer(initialState, {
        type: "SET_SAVIOR_TARGET",
        playerId: "3",
      });
      expect(state.saviorTarget).toBe("3");
    });
  });

  describe("SET_RAVEN_TARGET", () => {
    it("sets raven target", () => {
      const state = gameReducer(initialState, {
        type: "SET_RAVEN_TARGET",
        playerId: "5",
      });
      expect(state.ravenTarget).toBe("5");
    });

    it("sets raven target to null", () => {
      let state = gameReducer(initialState, {
        type: "SET_RAVEN_TARGET",
        playerId: "5",
      });
      state = gameReducer(state, { type: "SET_RAVEN_TARGET", playerId: null });
      expect(state.ravenTarget).toBeNull();
    });
  });

  describe("RESOLVE_NIGHT", () => {
    it("kills werewolf target when witch does not heal", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Victim", "villager", true),
          makePlayer("3", "Other", "villager", true),
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
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Victim", "villager", true),
          makePlayer("3", "Other", "villager", true),
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

    it("witch can poison a player", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Victim", "villager", true),
          makePlayer("3", "Poisoned", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: "3",
        },
        witchPotions: { life: true, death: true },
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.players.find((p) => p.id === "3")?.isAlive).toBe(false);
      expect(result.witchPotions.death).toBe(false);
    });

    it("triggers hunter screen when hunter is killed at night", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", true),
          makePlayer("3", "Other", "villager", true),
          makePlayer("4", "Other2", "villager", true),
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

    it("savior protecting target prevents death", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Protected", "villager", true),
          makePlayer("3", "Other", "villager", true),
          makePlayer("4", "Savior", "savior", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        saviorTarget: "2",
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.nightDeaths).not.toContain("2");
    });

    it("elder survives first attack (elderLives goes from 2 to 1)", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Elder", "elder", true),
          makePlayer("3", "Other", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        elderLives: 2,
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.elderLives).toBe(1);
      expect(result.nightDeaths).not.toContain("2");
    });

    it("lovers cascade: killing one lover kills the other", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Lover1", "villager", true),
          makePlayer("3", "Lover2", "seer", true),
          makePlayer("4", "Other", "villager", true),
        ],
        nightActions: {
          werewolvesTarget: "2",
          seerTarget: null,
          witchHeal: false,
          witchKill: null,
        },
        lovers: ["2", "3"],
        phase: "night",
      };

      const result = gameReducer(state, { type: "RESOLVE_NIGHT" });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.players.find((p) => p.id === "3")?.isAlive).toBe(false);
      expect(result.nightDeaths).toContain("2");
      expect(result.nightDeaths).toContain("3");
    });
  });

  describe("VOTE_ELIMINATE", () => {
    it("eliminates voted player and checks victory", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Villager", "villager", true),
          makePlayer("3", "Other", "villager", true),
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

    it("triggers hunter when hunter is voted out", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", true),
          makePlayer("3", "V1", "villager", true),
          makePlayer("4", "V2", "villager", true),
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

    it("village idiot survives first vote", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Idiot", "village_idiot", true),
          makePlayer("3", "V1", "villager", true),
          makePlayer("4", "V2", "villager", true),
        ],
        phase: "day",
        turn: 1,
        villageIdiotRevealed: false,
      };

      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "2",
      });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(true);
      expect(result.villageIdiotRevealed).toBe(true);
    });

    it("elder triggers power loss when killed by village", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Elder", "elder", true),
          makePlayer("3", "V1", "villager", true),
          makePlayer("4", "V2", "villager", true),
        ],
        phase: "day",
        turn: 1,
        elderKilledByVillage: false,
      };

      const result = gameReducer(state, {
        type: "VOTE_ELIMINATE",
        playerId: "2",
      });
      expect(result.players.find((p) => p.id === "2")?.isAlive).toBe(false);
      expect(result.elderKilledByVillage).toBe(true);
    });
  });

  describe("HUNTER_SHOOT", () => {
    it("hunter kills target and checks victory", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "V1", "villager", true),
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

    it("continues to day after night hunter shoot if no winner", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "V1", "villager", true),
          makePlayer("4", "V2", "villager", true),
          makePlayer("5", "V3", "villager", true),
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

    it("triggers lovers cascade when shooting a lover", () => {
      const state: GameState = {
        ...initialState,
        players: [
          makePlayer("1", "Wolf", "werewolf", true),
          makePlayer("2", "Hunter", "hunter", false),
          makePlayer("3", "Lover1", "villager", true),
          makePlayer("4", "Lover2", "seer", true),
          makePlayer("5", "V3", "villager", true),
        ],
        phase: "hunter",
        hunterContext: "night",
        turn: 1,
        lovers: ["3", "4"],
      };

      const result = gameReducer(state, {
        type: "HUNTER_SHOOT",
        playerId: "3",
      });
      expect(result.players.find((p) => p.id === "3")?.isAlive).toBe(false);
      expect(result.players.find((p) => p.id === "4")?.isAlive).toBe(false);
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
