// __tests__/useNarrator.test.ts

jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock mp3 requires to return a number (metro asset ID)
jest.mock("../assets/sounds/narrator/nightfall_phase.mp3", () => 1, { virtual: true });
jest.mock("../assets/sounds/narrator/loup_garou_phase.mp3", () => 2, { virtual: true });
jest.mock("../assets/sounds/narrator/voyante_phase.mp3", () => 3, { virtual: true });
jest.mock("../assets/sounds/narrator/sorcer_phase.mp3", () => 4, { virtual: true });
jest.mock("../assets/sounds/narrator/morning_phase.mp3", () => 5, { virtual: true });
jest.mock("../assets/sounds/ambiance_music.mp3", () => 6, { virtual: true });
jest.mock("../assets/sounds/werewolf.mp3", () => 7, { virtual: true });

import { NARRATOR_SOUNDS, AMBIANCE_SOUND } from "../hooks/useNarrator";

describe("useNarrator constants", () => {
  it("maps every NightStep to a narrator sound source", () => {
    const steps = ["intro", "werewolves", "seer", "witch", "resolution"] as const;
    for (const step of steps) {
      expect(NARRATOR_SOUNDS[step]).toBeDefined();
    }
  });

  it("has an ambiance sound source", () => {
    expect(AMBIANCE_SOUND).toBeDefined();
  });
});
