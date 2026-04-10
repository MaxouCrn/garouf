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

    const { data: player } = await admin
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!player) {
      return new Response(JSON.stringify({ error: "Player not in game" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: game } = await admin
      .from("games")
      .select("host_id")
      .eq("id", gameId)
      .single();

    const isHost = game?.host_id === player.id;

    await admin.from("players").delete().eq("id", player.id);

    if (isHost) {
      const { data: remaining } = await admin
        .from("players")
        .select("id")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (remaining) {
        await admin
          .from("games")
          .update({ host_id: remaining.id })
          .eq("id", gameId);
      } else {
        await admin
          .from("games")
          .update({ status: "finished" })
          .eq("id", gameId);

        return new Response(
          JSON.stringify({ gameClosed: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: updatedGame } = await admin
      .from("games")
      .select("host_id")
      .eq("id", gameId)
      .single();

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });

    const lobbyPlayers = (allPlayers ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === updatedGame?.host_id,
    }));

    const channel = admin.channel(`game:${gameId}`);
    await channel.send({
      type: "broadcast",
      event: "lobby:update",
      payload: { players: lobbyPlayers },
    });

    return new Response(
      JSON.stringify({ left: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
