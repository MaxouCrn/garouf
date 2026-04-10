import type { Role } from "./roles";

type Composition = Record<Role, number>;

function makeComposition(partial: Partial<Composition>): Composition {
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
    ...partial,
  };
}

const DEV_PRESETS: Record<number, Composition> = {
  2: makeComposition({ werewolf: 1, villager: 1 }),
  3: makeComposition({ werewolf: 1, seer: 1, villager: 1 }),
  4: makeComposition({ werewolf: 1, seer: 1, witch: 1, villager: 1 }),
  5: makeComposition({ werewolf: 2, seer: 1, witch: 1, villager: 1 }),
};

const PRESETS: Record<number, Composition> = {
  6: makeComposition({ werewolf: 2, seer: 1, villager: 3 }),
  7: makeComposition({ werewolf: 2, seer: 1, witch: 1, villager: 3 }),
  8: makeComposition({ werewolf: 2, seer: 1, witch: 1, hunter: 1, villager: 3 }),
  9: makeComposition({ werewolf: 2, seer: 1, witch: 1, hunter: 1, cupid: 1, villager: 3 }),
  10: makeComposition({ werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, villager: 3 }),
  11: makeComposition({ werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, villager: 3 }),
  12: makeComposition({ werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, villager: 3 }),
  13: makeComposition({ werewolf: 3, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, villager: 3 }),
  14: makeComposition({ werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, villager: 3 }),
  15: makeComposition({ werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, villager: 3 }),
  16: makeComposition({ werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 1, villager: 3 }),
  17: makeComposition({ werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 1, villager: 4 }),
  18: makeComposition({ werewolf: 4, seer: 1, witch: 1, hunter: 1, cupid: 1, little_girl: 1, savior: 1, elder: 1, raven: 1, village_idiot: 1, villager: 5 }),
};

export function getPreset(playerCount: number): Composition {
  if (__DEV__ && playerCount < 6 && DEV_PRESETS[playerCount]) {
    return { ...DEV_PRESETS[playerCount] };
  }
  const clamped = Math.max(6, Math.min(18, playerCount));
  return { ...PRESETS[clamped] };
}

export function getBalanceWarnings(
  playerCount: number,
  composition: Composition
): string[] {
  const warnings: string[] = [];
  const recommended = getPreset(playerCount);

  const totalPlayers = Object.values(composition).reduce((a, b) => a + b, 0);
  const wolves = composition.werewolf;
  const nonWolves = totalPlayers - wolves;

  // Too many werewolves
  if (wolves > recommended.werewolf + 1) {
    warnings.push(
      `Trop de Loups-Garous pour ${playerCount} joueurs (recommandé : ${recommended.werewolf})`
    );
  }

  // No info roles
  if (composition.seer === 0 && composition.witch === 0) {
    warnings.push(
      "Aucune Voyante ni Sorcière — le village manque d'information"
    );
  }

  // Not enough villagers
  if (composition.villager < 1) {
    warnings.push(
      "Pas assez de Villageois simples — les rôles sont trop devinables"
    );
  }

  // Wolf ratio imbalance
  if (nonWolves > 0 && wolves / nonWolves > 0.5) {
    warnings.push("Le ratio Loups/Villageois semble déséquilibré");
  }

  // Cupid too early
  if (composition.cupid > 0 && playerCount < 9) {
    warnings.push(
      "Le Cupidon est plus intéressant à partir de 9 joueurs"
    );
  }

  return warnings;
}
