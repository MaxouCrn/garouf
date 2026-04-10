import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  werewolf: "Chaque nuit, les Loups-Garous designent une victime.",
  villager: "Pas de pouvoir special, mais ta voix compte au vote.",
  seer: "Chaque nuit, decouvre la veritable identite d'un joueur.",
  witch: "Tu as une potion de vie et une potion de mort.",
  hunter: "Quand tu meurs, tu tires sur le joueur de ton choix.",
  cupid: "La premiere nuit, designe deux amoureux.",
  little_girl: "Certaines nuits, tu apercois des silhouettes suspectes.",
  savior: "Chaque nuit, protege un joueur des loups.",
  elder: "Tu resistes a une attaque des loups (2 vies).",
  raven: "Chaque nuit, designe un joueur qui recevra 2 votes bonus.",
  village_idiot: "Tu survis a ton premier vote d'elimination.",
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { gameId, settings } = await req.json();
    const admin = getSupabaseAdmin();

    // Verify game exists and caller is host
    const { data: game } = await admin
      .from("games")
      .select("id, host_id, status")
      .eq("id", gameId)
      .single();

    if (!game || game.status !== "lobby") {
      return new Response(JSON.stringify({ error: "Game not in lobby" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify host
    const { data: hostPlayer } = await admin
      .from("players")
      .select("id, user_id")
      .eq("id", game.host_id)
      .single();

    if (!hostPlayer || hostPlayer.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only host can start" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get players
    const { data: players } = await admin
      .from("players")
      .select("id, name, user_id")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });

    if (!players || players.length < 6 || players.length > 18) {
      return new Response(JSON.stringify({ error: "Need 6-18 players" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build role list from settings
    const selectedRoles: { role: string; count: number }[] = settings?.selectedRoles ?? [];
    const roleList: string[] = [];
    for (const { role, count } of selectedRoles) {
      for (let i = 0; i < count; i++) {
        roleList.push(role);
      }
    }

    if (roleList.length !== players.length) {
      return new Response(
        JSON.stringify({ error: `Role count (${roleList.length}) != player count (${players.length})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Shuffle and assign
    const shuffledRoles = shuffleArray(roleList);
    const channel = admin.channel(`game:${gameId}`);

    for (let i = 0; i < players.length; i++) {
      const role = shuffledRoles[i];
      await admin
        .from("players")
        .update({ role })
        .eq("id", players[i].id);

      // Send private role assignment
      await channel.send({
        type: "broadcast",
        event: `private:${players[i].id}:role:assign`,
        payload: {
          role,
          description: ROLE_DESCRIPTIONS[role] ?? "",
        },
      });
    }

    // Update game status
    await admin
      .from("games")
      .update({
        status: "playing",
        phase: "distribution",
        settings: settings ?? { selectedRoles: [], debateTimerMinutes: 3 },
      })
      .eq("id", gameId);

    // Broadcast phase change
    await channel.send({
      type: "broadcast",
      event: "game:phase",
      payload: { phase: "distribution", turn: 0 },
    });

    return new Response(
      JSON.stringify({ started: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
