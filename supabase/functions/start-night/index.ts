import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initNightSnapshot } from "../_shared/nightInit.ts";

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
    const turn = (snapshot.turn || 0) + 1;
    snapshot.turn = turn;

    const nightSteps = initNightSnapshot(snapshot, allPlayers || [], turn);

    await admin.from("games").update({ phase: "night", state_snapshot: snapshot }).eq("id", gameId);

    const channel = admin.channel(`game:${gameId}`);
    await channel.send({ type: "broadcast", event: "game:phase", payload: { phase: "night", turn, nightStep: "intro" } });
    await channel.send({ type: "broadcast", event: "night:step", payload: { step: "intro" } });

    return new Response(JSON.stringify({ started: true, nightSteps }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
