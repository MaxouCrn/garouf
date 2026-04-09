import { Role } from "./roles";

// ── Shared ───────────────────────────────────────────────────────────────────

interface PlayerLike {
  id: string;
  role: Role | null;
  isAlive: boolean;
}

// ── resolveNight ─────────────────────────────────────────────────────────────

interface NightInput {
  players: PlayerLike[];
  nightActions: {
    werewolvesTarget: string | null;
    seerTarget: string | null;
    witchHeal: boolean;
    witchKill: string | null;
  };
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
    players,
    nightActions,
    witchPotions,
    saviorTarget,
    elderLives,
    lovers,
  } = input;

  const deaths: string[] = [];
  let savedByWitch = false;
  let savedBySavior = false;
  let elderLostLife = false;
  let newElderLives = elderLives;
  const updatedPotions = { ...witchPotions };

  const target = nightActions.werewolvesTarget;

  if (target !== null) {
    let targetSaved = false;

    // 1. Savior protection
    if (saviorTarget === target) {
      targetSaved = true;
      savedBySavior = true;
    }

    // 2. Elder protection (wolf attack only, not already saved)
    if (!targetSaved) {
      const targetPlayer = players.find((p) => p.id === target);
      if (targetPlayer?.role === "elder" && elderLives > 1) {
        targetSaved = true;
        elderLostLife = true;
        newElderLives = elderLives - 1;
      }
    }

    // 3. Witch heal (only if not already saved by savior/elder)
    if (!targetSaved && nightActions.witchHeal && updatedPotions.life) {
      targetSaved = true;
      savedByWitch = true;
      updatedPotions.life = false;
    }

    // 4. If not saved → dies
    if (!targetSaved) {
      deaths.push(target);
    }
  }

  // 5. Witch poison (independent, always kills, savior does NOT block)
  if (nightActions.witchKill !== null && updatedPotions.death) {
    const poisonTarget = nightActions.witchKill;
    if (!deaths.includes(poisonTarget)) {
      deaths.push(poisonTarget);
    }
    updatedPotions.death = false;
  }

  // 6. Lovers cascade
  let loversCascade: string | null = null;
  if (lovers !== null) {
    for (const deadId of [...deaths]) {
      if (lovers[0] === deadId && !deaths.includes(lovers[1])) {
        loversCascade = lovers[1];
        deaths.push(lovers[1]);
        break;
      } else if (lovers[1] === deadId && !deaths.includes(lovers[0])) {
        loversCascade = lovers[0];
        deaths.push(lovers[0]);
        break;
      }
    }
  }

  // 7. Hunter trigger
  const hunterTriggered = deaths.some((id) => {
    const p = players.find((pl) => pl.id === id);
    return p?.role === "hunter";
  });

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

// ── resolveVote ──────────────────────────────────────────────────────────────

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
  const { players, lovers, villageIdiotRevealed } = input;
  let { elderKilledByVillage } = input;

  const votedPlayer = players.find((p) => p.id === votedPlayerId);

  // 1. Village Idiot first-reveal protection
  if (votedPlayer?.role === "village_idiot" && !villageIdiotRevealed) {
    return {
      deaths: [],
      villageIdiotSurvived: true,
      hunterTriggered: false,
      loversCascade: null,
      elderKilledByVillage,
    };
  }

  // 2. Player dies
  const deaths: string[] = [votedPlayerId];

  // 3. Elder check
  if (votedPlayer?.role === "elder") {
    elderKilledByVillage = true;
  }

  // 4. Lovers cascade
  let loversCascade: string | null = null;
  if (lovers !== null) {
    if (lovers[0] === votedPlayerId && !deaths.includes(lovers[1])) {
      loversCascade = lovers[1];
      deaths.push(lovers[1]);
    } else if (lovers[1] === votedPlayerId && !deaths.includes(lovers[0])) {
      loversCascade = lovers[0];
      deaths.push(lovers[0]);
    }
  }

  // 5. Hunter trigger
  const hunterTriggered = deaths.some((id) => {
    const p = players.find((pl) => pl.id === id);
    return p?.role === "hunter";
  });

  return {
    deaths,
    villageIdiotSurvived: false,
    hunterTriggered,
    loversCascade,
    elderKilledByVillage,
  };
}

// ── generateLittleGirlClue ───────────────────────────────────────────────────

export function generateLittleGirlClue(players: PlayerLike[]): string[] {
  const aliveWolves = players.filter(
    (p) => p.isAlive && p.role === "werewolf"
  );
  const aliveNonWolves = players.filter(
    (p) => p.isAlive && p.role !== "werewolf" && p.role !== "little_girl"
  );

  if (aliveWolves.length === 0) return [];

  // Pick 1 random wolf
  const wolf = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];

  // Pick 1 or 2 random non-wolves
  const shuffledNonWolves = [...aliveNonWolves].sort(() => Math.random() - 0.5);
  const nonWolfCount = Math.min(
    1 + Math.floor(Math.random() * 2), // 1 or 2
    shuffledNonWolves.length
  );
  const selectedNonWolves = shuffledNonWolves.slice(0, nonWolfCount);

  const clues = [wolf.id, ...selectedNonWolves.map((p) => p.id)];

  // Shuffle final list
  return clues.sort(() => Math.random() - 0.5);
}
