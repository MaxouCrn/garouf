import { Role } from "./roles";

export type NightStep =
  | "intro"
  | "cupid"
  | "lovers_reveal"
  | "seer"
  | "savior"
  | "werewolves"
  | "witch"
  | "raven"
  | "little_girl"
  | "resolution";

type Player = { role: Role | null; isAlive: boolean };

function isAlive(players: Player[], role: Role): boolean {
  return players.some((p) => p.role === role && p.isAlive);
}

export function buildNightSteps(
  players: Player[],
  isFirstNight: boolean,
  currentTurn: number,
  elderKilledByVillage: boolean
): NightStep[] {
  const steps: NightStep[] = ["intro"];

  if (elderKilledByVillage) {
    steps.push("werewolves", "resolution");
    return steps;
  }

  if (isFirstNight && isAlive(players, "cupid")) {
    steps.push("cupid", "lovers_reveal");
  }

  if (isAlive(players, "seer")) steps.push("seer");
  if (isAlive(players, "savior")) steps.push("savior");

  steps.push("werewolves");

  if (isAlive(players, "witch")) steps.push("witch");
  if (isAlive(players, "raven")) steps.push("raven");
  if (isAlive(players, "little_girl") && currentTurn % 2 !== 0)
    steps.push("little_girl");

  steps.push("resolution");
  return steps;
}
