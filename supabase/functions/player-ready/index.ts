import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { gameId, playerId } = await req.json();
    if (!gameId || !playerId) {
      return new Response(JSON.stringify({ error: "Missing gameId or playerId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    // Fetch game
    const { data: game } = await admin
      .from("games")
      .select("id, phase, state_snapshot")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "distribution") {
      return new Response(JSON.stringify({ error: "Game not in distribution phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify player exists in this game
    const { data: player } = await admin
      .from("players")
      .select("id")
      .eq("id", playerId)
      .eq("game_id", gameId)
      .single();

    if (!player) {
      return new Response(JSON.stringify({ error: "Player not in game" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomically add player to readyPlayers via RPC (avoids race condition)
    const { data: rpcResult, error: rpcError } = await admin.rpc("add_ready_player", {
      p_game_id: gameId,
      p_player_id: playerId,
    });

    if (rpcError) throw rpcError;

    const readyPlayers: string[] = rpcResult?.readyPlayers || [];

    // Count total players
    const { count } = await admin
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    const totalPlayers = count || 0;
    const readyCount = readyPlayers.length;

    // Broadcast ready update to all players
    const channel = admin.channel(`game:${gameId}`);
    await channel.send({
      type: "broadcast",
      event: "distribution:ready_update",
      payload: { readyCount, totalPlayers },
    });

    return new Response(
      JSON.stringify({ readyCount, totalPlayers }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
