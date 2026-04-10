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

    const { gameId, targetId } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "day") {
      return new Response(JSON.stringify({ error: "Game not in day phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = game.state_snapshot || {};
    const { data: player } = await admin
      .from("players")
      .select("id, role, is_alive")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player || !player.is_alive) {
      return new Response(JSON.stringify({ error: "Player not alive" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if village_idiot has lost voting rights
    if (player.role === "village_idiot" && snapshot.villageIdiotRevealed) {
      return new Response(JSON.stringify({ error: "Village idiot cannot vote" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store vote
    await admin.from("actions").insert({
      game_id: gameId,
      player_id: player.id,
      action_type: "vote",
      payload: { targetId: targetId || null }, // null = abstention
      phase: "day",
      turn: snapshot.turn || 1,
    });

    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, role, is_alive")
      .eq("game_id", gameId);

    const alivePlayers = (allPlayers || []).filter((p: any) => p.is_alive);
    const eligibleVoters = alivePlayers.filter(
      (p: any) => !(p.role === "village_idiot" && snapshot.villageIdiotRevealed)
    );

    // Get all votes for this turn
    const { data: allVotes } = await admin
      .from("actions")
      .select("player_id, payload")
      .eq("game_id", gameId)
      .eq("action_type", "vote")
      .eq("phase", "day")
      .eq("turn", snapshot.turn || 1);

    const channel = admin.channel(`game:${gameId}`);

    // Broadcast vote progress
    await channel.send({
      type: "broadcast",
      event: "vote:status",
      payload: {
        votedCount: (allVotes || []).length,
        totalVoters: eligibleVoters.length,
      },
    });

    // Check if all eligible voters have voted
    if ((allVotes || []).length < eligibleVoters.length) {
      return new Response(
        JSON.stringify({ received: true, waitingForOthers: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tally votes
    const voteTally: Record<string, number> = {};
    const voteDetails: Record<string, string> = {};

    for (const v of allVotes || []) {
      const tid = (v.payload as any)?.targetId;
      voteDetails[v.player_id] = tid || "abstain";
      if (tid) {
        voteTally[tid] = (voteTally[tid] || 0) + 1;
      }
    }

    // Apply raven bonus
    if (snapshot.ravenTarget && voteTally[snapshot.ravenTarget] !== undefined) {
      voteTally[snapshot.ravenTarget] += 2;
    } else if (snapshot.ravenTarget) {
      voteTally[snapshot.ravenTarget] = 2;
    }

    // Find max votes
    let maxVotes = 0;
    let candidates: string[] = [];
    for (const [tid, count] of Object.entries(voteTally)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [tid];
      } else if (count === maxVotes) {
        candidates.push(tid);
      }
    }

    // Tie = no elimination
    let eliminatedId: string | null = null;
    let villageIdiotSurvived = false;

    if (candidates.length === 1 && maxVotes > 0) {
      eliminatedId = candidates[0];

      // Check village idiot
      const eliminatedPlayer = (allPlayers || []).find((p: any) => p.id === eliminatedId);
      if (eliminatedPlayer?.role === "village_idiot" && !snapshot.villageIdiotRevealed) {
        villageIdiotSurvived = true;
        snapshot.villageIdiotRevealed = true;
        eliminatedId = null;
      }
    }

    const deaths: string[] = [];
    let hunterTriggered = false;

    if (eliminatedId) {
      deaths.push(eliminatedId);

      // Elder killed by village check
      const eliminatedPlayer = (allPlayers || []).find((p: any) => p.id === eliminatedId);
      if (eliminatedPlayer?.role === "elder") {
        snapshot.elderKilledByVillage = true;
      }

      // Lovers cascade
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        if (l1 === eliminatedId && !deaths.includes(l2)) {
          deaths.push(l2);
        } else if (l2 === eliminatedId && !deaths.includes(l1)) {
          deaths.push(l1);
        }
      }

      // Apply deaths
      for (const deadId of deaths) {
        await admin.from("players").update({ is_alive: false }).eq("id", deadId);
      }

      // Hunter check
      hunterTriggered = deaths.some((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return p?.role === "hunter";
      });
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

    // Determine next phase
    let nextPhase = "night";
    if (winner) nextPhase = "end";
    else if (hunterTriggered) nextPhase = "hunter";

    const nextTurn = (snapshot.turn || 1) + (nextPhase === "night" ? 1 : 0);
    snapshot.turn = nextTurn;
    snapshot.ravenTarget = null;
    snapshot.isFirstNight = false;

    await admin
      .from("games")
      .update({
        phase: nextPhase,
        state_snapshot: snapshot,
        ...(winner ? { status: "finished" } : {}),
      })
      .eq("id", gameId);

    const eliminatedPlayer = eliminatedId ? (allPlayers || []).find((p: any) => p.id === eliminatedId) : null;

    await channel.send({
      type: "broadcast",
      event: "vote:result",
      payload: {
        eliminated: eliminatedPlayer ? { id: eliminatedPlayer.id, name: eliminatedPlayer.name } : null,
        voteDetails,
        villageIdiotSurvived,
      },
    });

    await channel.send({
      type: "broadcast",
      event: "game:state",
      payload: {
        alivePlayers: updatedPlayers.filter((p: any) => p.is_alive).map((p: any) => ({ id: p.id, name: p.name })),
        nightDeaths: [],
        winner,
      },
    });

    await channel.send({
      type: "broadcast",
      event: "game:phase",
      payload: { phase: nextPhase, turn: nextTurn },
    });

    return new Response(
      JSON.stringify({ resolved: true, eliminated: eliminatedPlayer?.name, winner }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
