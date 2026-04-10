import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { code, name } = await req.json();
    if (!code || !name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Code and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    const { data: game, error: gameError } = await admin
      .from("games")
      .select("id, status, host_id")
      .eq("code", code.toUpperCase().trim())
      .eq("status", "lobby")
      .maybeSingle();

    if (gameError) throw gameError;
    if (!game) {
      return new Response(JSON.stringify({ error: "Partie introuvable ou deja lancee" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await admin
      .from("players")
      .select("id")
      .eq("game_id", game.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ gameId: game.id, playerId: existing.id, alreadyJoined: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count } = await admin
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", game.id);

    if ((count ?? 0) >= 18) {
      return new Response(JSON.stringify({ error: "La partie est pleine (18 joueurs max)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: player, error: playerError } = await admin
      .from("players")
      .insert({
        game_id: game.id,
        user_id: user.id,
        name: name.trim(),
      })
      .select("id")
      .single();

    if (playerError) throw playerError;

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name")
      .eq("game_id", game.id)
      .order("joined_at", { ascending: true });

    const lobbyPlayers = (allPlayers ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === game.host_id,
    }));

    const channel = admin.channel(`game:${game.id}`);
    await channel.send({
      type: "broadcast",
      event: "lobby:update",
      payload: { players: lobbyPlayers },
    });

    return new Response(
      JSON.stringify({ gameId: game.id, playerId: player.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
