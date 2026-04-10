import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function isAliveWithRole(players: any[], role: string): boolean {
  return players.some((p: any) => p.role === role && p.is_alive);
}

function buildNightSteps(players: any[], isFirstNight: boolean, currentTurn: number, elderKilledByVillage: boolean): string[] {
  const steps: string[] = ["intro"];
  if (elderKilledByVillage) { steps.push("werewolves", "resolution"); return steps; }
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

const STEP_ROLE_MAP: Record<string, string> = {
  cupid: "cupid", seer: "seer", savior: "savior", werewolves: "werewolf",
  witch: "witch", raven: "raven", little_girl: "little_girl",
};
const STEP_TIMER: Record<string, number> = {
  cupid: 15, seer: 15, savior: 15, werewolves: 30, witch: 15, raven: 15, little_girl: 15,
};
const STEP_INSTRUCTION: Record<string, string> = {
  cupid: "Designe deux joueurs qui seront lies par l'amour.",
  seer: "Choisis un joueur pour decouvrir son role.",
  savior: "Choisis un joueur a proteger cette nuit.",
  werewolves: "Choisissez ensemble une victime.",
  witch: "Utilise tes potions ou passe ton tour.",
  raven: "Designe un joueur qui recevra 2 votes bonus demain.",
  little_girl: "Observe les silhouettes dans la nuit...",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { gameId } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin.from("games").select("*").eq("id", gameId).single();
    if (!game || (game.phase !== "distribution" && game.phase !== "day")) {
      return new Response(JSON.stringify({ error: "Game not in distribution or day phase" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: hostPlayer } = await admin.from("players").select("id, user_id").eq("id", game.host_id).single();
    if (!hostPlayer || hostPlayer.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only host can start night" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: allPlayers } = await admin.from("players").select("id, name, role, is_alive").eq("game_id", gameId);

    const snapshot = game.state_snapshot || {};
    const isFirstNight = snapshot.isFirstNight !== false;
    const turn = (snapshot.turn || 0) + 1;
    const elderKilledByVillage = snapshot.elderKilledByVillage || false;

    const nightSteps = buildNightSteps(allPlayers || [], isFirstNight, turn, elderKilledByVillage);

    snapshot.turn = turn;
    snapshot.nightSteps = nightSteps;
    snapshot.nightStepIndex = 0;
    snapshot.currentNightStep = nightSteps[0];
    snapshot.nightActions = { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null };
    snapshot.saviorTarget = null;
    snapshot.nightDeaths = [];
    if (isFirstNight) snapshot.isFirstNight = true;
    if (!snapshot.witchPotions) snapshot.witchPotions = { life: true, death: true };
    if (!snapshot.elderLives) snapshot.elderLives = 2;

    await admin.from("games").update({ phase: "night", state_snapshot: snapshot }).eq("id", gameId);

    const channel = admin.channel(`game:${gameId}`);
    await channel.send({ type: "broadcast", event: "game:phase", payload: { phase: "night", turn, nightStep: "intro" } });
    await channel.send({ type: "broadcast", event: "night:step", payload: { step: "intro" } });

    if (nightSteps.length > 1) {
      const firstRealStep = nightSteps[1];
      snapshot.nightStepIndex = 1;
      snapshot.currentNightStep = firstRealStep;
      await admin.from("games").update({ state_snapshot: snapshot }).eq("id", gameId);
      await channel.send({ type: "broadcast", event: "night:step", payload: { step: firstRealStep } });

      const stepRole = STEP_ROLE_MAP[firstRealStep];
      if (stepRole) {
        const activePlayers = (allPlayers || []).filter((p: any) => p.is_alive && p.role === stepRole);
        const targets = (allPlayers || []).filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name }));
        for (const activePlayer of activePlayers) {
          const actionPayload: any = {
            step: firstRealStep, targets,
            instruction: STEP_INSTRUCTION[firstRealStep] || "",
            timerSeconds: STEP_TIMER[firstRealStep] || 15,
          };
          await channel.send({ type: "broadcast", event: `private:${activePlayer.id}:night:action_required`, payload: actionPayload });
        }
      }
    }

    return new Response(JSON.stringify({ started: true, nightSteps }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
