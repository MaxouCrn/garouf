import {
  checkWinner,
  gameReducer,
  initialState,
  GameState,
  Player,
  getNextNightStep,
} from "../context/GameContext";

function makePlayer(
  id: string,
  name: string,
  role: "werewolf" | "villager" | "seer" | "witch" | "hunter",
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
});

describe("getNextNightStep", () => {
  const playersWithAll: Player[] = [
    makePlayer("1", "A", "werewolf", true),
    makePlayer("2", "B", "seer", true),
    makePlayer("3", "C", "witch", true),
    makePlayer("4", "D", "villager", true),
  ];

  it("goes from intro to werewolves", () => {
    expect(getNextNightStep("intro", playersWithAll)).toBe("werewolves");
  });

  it("goes from werewolves to seer when seer is alive", () => {
    expect(getNextNightStep("werewolves", playersWithAll)).toBe("seer");
  });

  it("skips seer when seer is dead", () => {
    const players = playersWithAll.map((p) =>
      p.role === "seer" ? { ...p, isAlive: false } : p
    );
    expect(getNextNightStep("werewolves", players)).toBe("witch");
  });

  it("skips witch when witch is dead", () => {
    const players = playersWithAll.map((p) =>
      p.role === "witch" ? { ...p, isAlive: false } : p
    );
    expect(getNextNightStep("seer", players)).toBe("resolution");
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
