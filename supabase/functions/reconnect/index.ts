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

    const { gameId } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: player } = await admin
      .from("players")
      .select("id, role, is_alive, name")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player) {
      return new Response(JSON.stringify({ error: "Player not in game" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as connected
    await admin
      .from("players")
      .update({ is_connected: true })
      .eq("id", player.id);

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, is_alive")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });

    return new Response(
      JSON.stringify({
        game: {
          id: game.id,
          code: game.code,
          status: game.status,
          phase: game.phase,
          settings: game.settings,
        },
        player: {
          id: player.id,
          role: player.role,
          isAlive: player.is_alive,
          name: player.name,
        },
        snapshot: game.state_snapshot,
        alivePlayers: (allPlayers || [])
          .filter((p: any) => p.is_alive)
          .map((p: any) => ({ id: p.id, name: p.name })),
        allPlayers: (allPlayers || [])
          .map((p: any) => ({ id: p.id, name: p.name })),
        hostId: game.host_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
