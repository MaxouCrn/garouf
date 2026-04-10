/** Shared night-phase initialization logic. */

function isAliveWithRole(players: any[], role: string): boolean {
  return players.some((p: any) => p.role === role && p.is_alive);
}

export function buildNightSteps(
  players: any[],
  isFirstNight: boolean,
  currentTurn: number,
  elderKilledByVillage: boolean
): string[] {
  const steps: string[] = ["intro"];
  if (elderKilledByVillage) {
    steps.push("werewolves", "resolution");
    return steps;
  }
  if (isFirstNight && isAliveWithRole(players, "cupid")) steps.push("cupid", "lovers_reveal");
  if (isAliveWithRole(players, "seer")) steps.push("seer");
  if (isAliveWithRole(players, "savior")) steps.push("savior");
  steps.push("werewolves");
  if (isAliveWithRole(players, "witch")) steps.push("witch");
  if (isAliveWithRole(players, "raven")) steps.push("raven");
  if (isAliveWithRole(players, "little_girl") && currentTurn % 2 !== 0) steps.push("little_girl");
  steps.push("resolution");
  return steps;
}

/**
 * Mutates `snapshot` in place to set up night state,
 * returns the built nightSteps array.
 */
export function initNightSnapshot(
  snapshot: Record<string, any>,
  players: any[],
  turn: number
): string[] {
  const isFirstNight = snapshot.isFirstNight !== false;
  const elderKilledByVillage = snapshot.elderKilledByVillage || false;

  const nightSteps = buildNightSteps(players, isFirstNight, turn, elderKilledByVillage);

  snapshot.nightSteps = nightSteps;
  snapshot.nightStepIndex = 0;
  snapshot.currentNightStep = nightSteps[0];
  snapshot.nightActions = {
    werewolvesTarget: null,
    seerTarget: null,
    witchHeal: false,
    witchKill: null,
  };
  snapshot.saviorTarget = null;
  snapshot.nightDeaths = [];
  if (isFirstNight) snapshot.isFirstNight = true;
  if (!snapshot.witchPotions) snapshot.witchPotions = { life: true, death: true };
  if (!snapshot.elderLives) snapshot.elderLives = 2;

  return nightSteps;
}
