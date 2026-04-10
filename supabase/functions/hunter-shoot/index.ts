import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initNightSnapshot } from "../_shared/nightInit.ts";

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

    const { gameId, targetId } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "hunter") {
      return new Response(JSON.stringify({ error: "Game not in hunter phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: player } = await admin
      .from("players")
      .select("id, role, user_id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player || player.role !== "hunter") {
      return new Response(JSON.stringify({ error: "Not the hunter" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = game.state_snapshot || {};
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, role, is_alive")
      .eq("game_id", gameId);

    const deaths: string[] = [];

    if (targetId) {
      deaths.push(targetId);
      await admin.from("players").update({ is_alive: false }).eq("id", targetId);

      // Lovers cascade
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        if (l1 === targetId && !deaths.includes(l2)) {
          deaths.push(l2);
          await admin.from("players").update({ is_alive: false }).eq("id", l2);
        } else if (l2 === targetId && !deaths.includes(l1)) {
          deaths.push(l1);
          await admin.from("players").update({ is_alive: false }).eq("id", l1);
        }
      }
    }

    // Check winner
    const updatedPlayers = (allPlayers || []).map((p: any) => ({
      ...p,
      is_alive: deaths.includes(p.id) ? false : p.is_alive,
    }));
    const aliveWolves = updatedPlayers.filter((p: any) => p.is_alive && p.role === "werewolf");
    const aliveVillage = updatedPlayers.filter((p: any) => p.is_alive && p.role !== "werewolf");
    const aliveAll = updatedPlayers.filter((p: any) => p.is_alive);

    let winner: string | null = null;
    if (aliveWolves.length === 0) winner = "villagers";
    else if (aliveVillage.length === 0) winner = "werewolves";

    if (!winner && snapshot.lovers) {
      const [l1, l2] = snapshot.lovers;
      const l1p = updatedPlayers.find((p: any) => p.id === l1);
      const l2p = updatedPlayers.find((p: any) => p.id === l2);
      if (l1p && l2p) {
        const isMixed = (l1p.role === "werewolf") !== (l2p.role === "werewolf");
        if (isMixed && l1p.is_alive && l2p.is_alive && aliveAll.length === 2) {
          winner = "lovers";
        }
      }
    }

    // Determine next phase — if hunter was triggered during night, go to day; during day, go to night
    let nextPhase = winner ? "end" : (snapshot.hunterContext === "night" ? "day" : "night");
    const nextTurn = nextPhase === "night" ? (snapshot.turn || 1) + 1 : (snapshot.turn || 1);

    snapshot.turn = nextTurn;
    if (nextPhase === "day") {
      snapshot.daySubPhase = "announcement";
    }
    if (nextPhase === "night") {
      initNightSnapshot(snapshot, updatedPlayers, nextTurn);
    }

    await admin
      .from("games")
      .update({
        phase: nextPhase,
        state_snapshot: snapshot,
        ...(winner ? { status: "finished" } : {}),
      })
      .eq("id", gameId);

    const channel = admin.channel(`game:${gameId}`);

    // Combine original night deaths with hunter kills for the day announcement
    const originalNightDeaths: string[] = snapshot.nightDeaths || [];
    const allDeaths = [...new Set([...originalNightDeaths, ...deaths])];

    await channel.send({
      type: "broadcast",
      event: "game:state",
      payload: {
        alivePlayers: updatedPlayers.filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name })),
        nightDeaths: allDeaths.map((id: string) => {
          const p = (allPlayers || []).find((pl: any) => pl.id === id);
          return { id, name: p?.name || "?" };
        }),
        winner,
      },
    });

    await channel.send({
      type: "broadcast",
      event: "game:phase",
      payload: {
        phase: nextPhase,
        turn: nextTurn,
        ...(nextPhase === "night" ? { nightStep: "intro" } : {}),
      },
    });

    if (nextPhase === "night") {
      await channel.send({
        type: "broadcast",
        event: "night:step",
        payload: { step: "intro" },
      });
    }

    return new Response(
      JSON.stringify({ resolved: true, winner }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
