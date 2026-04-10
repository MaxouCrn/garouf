import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Night step order (must match client)
const STEP_ROLE_MAP: Record<string, string | string[]> = {
  cupid: "cupid",
  seer: "seer",
  savior: "savior",
  werewolves: "werewolf",
  witch: "witch",
  raven: "raven",
  little_girl: "little_girl",
};

const STEP_TIMER: Record<string, number> = {
  cupid: 15,
  seer: 15,
  savior: 15,
  werewolves: 30,
  witch: 15,
  raven: 15,
  little_girl: 15,
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

function isAliveWithRole(players: any[], role: string): boolean {
  return players.some((p: any) => p.role === role && p.is_alive);
}

function buildNightSteps(players: any[], isFirstNight: boolean, currentTurn: number, elderKilledByVillage: boolean): string[] {
  const steps: string[] = ["intro"];

  if (elderKilledByVillage) {
    steps.push("werewolves", "resolution");
    return steps;
  }

  if (isFirstNight && isAliveWithRole(players, "cupid")) {
    steps.push("cupid", "lovers_reveal");
  }

  if (isAliveWithRole(players, "seer")) steps.push("seer");
  if (isAliveWithRole(players, "savior")) steps.push("savior");

  steps.push("werewolves");

  if (isAliveWithRole(players, "witch")) steps.push("witch");
  if (isAliveWithRole(players, "raven")) steps.push("raven");
  if (isAliveWithRole(players, "little_girl") && currentTurn % 2 !== 0)
    steps.push("little_girl");

  steps.push("resolution");
  return steps;
}

function generateLittleGirlClue(players: any[]): string[] {
  const aliveWolves = players.filter((p: any) => p.is_alive && p.role === "werewolf");
  const aliveNonWolves = players.filter(
    (p: any) => p.is_alive && p.role !== "werewolf" && p.role !== "little_girl"
  );

  if (aliveWolves.length === 0) return [];

  const wolf = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];
  const shuffledNonWolves = [...aliveNonWolves].sort(() => Math.random() - 0.5);
  const nonWolfCount = Math.min(1 + Math.floor(Math.random() * 2), shuffledNonWolves.length);
  const selectedNonWolves = shuffledNonWolves.slice(0, nonWolfCount);

  const clues = [wolf.id, ...selectedNonWolves.map((p: any) => p.id)];
  return clues.sort(() => Math.random() - 0.5);
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

    const { gameId, actionType, payload } = await req.json();
    const admin = getSupabaseAdmin();

    // Get game state
    const { data: game } = await admin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (!game || game.phase !== "night") {
      return new Response(JSON.stringify({ error: "Game not in night phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = game.state_snapshot || {};
    const currentStep = snapshot.currentNightStep;
    const nightSteps = snapshot.nightSteps || [];
    const nightStepIndex = snapshot.nightStepIndex || 0;

    // Get player
    const { data: player } = await admin
      .from("players")
      .select("id, role, is_alive, user_id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!player || !player.is_alive) {
      return new Response(JSON.stringify({ error: "Player not alive" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const channel = admin.channel(`game:${gameId}`);
    const { data: allPlayers } = await admin
      .from("players")
      .select("id, name, role, is_alive")
      .eq("game_id", gameId);

    // Track seer result to include in HTTP response (broadcasts are unreliable)
    let seerResult: { role: string; name: string } | null = null;

    // Handle wolf vote broadcast
    if ((actionType === "werewolf_target" || actionType === "werewolf_timeout") && currentStep === "werewolves") {
      if (actionType === "werewolf_target") {
        // Delete any previous vote from this wolf for this turn before inserting
        await admin.from("actions").delete()
          .eq("game_id", gameId)
          .eq("player_id", player.id)
          .eq("action_type", "werewolf_target")
          .eq("phase", "night")
          .eq("turn", snapshot.turn || 1);

        // Insert the new vote
        await admin.from("actions").insert({
          game_id: gameId,
          player_id: player.id,
          action_type: actionType,
          payload: payload || {},
          phase: "night",
          turn: snapshot.turn || 1,
        });
      }

      const { data: wolfActions } = await admin
        .from("actions")
        .select("payload, player_id")
        .eq("game_id", gameId)
        .eq("action_type", "werewolf_target")
        .eq("phase", "night")
        .eq("turn", snapshot.turn || 1);

      const voteCounts: Record<string, number> = {};
      for (const a of wolfActions || []) {
        const targetId = (a.payload as any)?.targetId;
        if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }

      // Broadcast current vote state to wolves only
      const wolves = (allPlayers || []).filter((p: any) => p.role === "werewolf" && p.is_alive);
      for (const wolf of wolves) {
        await channel.send({
          type: "broadcast",
          event: `private:${wolf.id}:wolf:vote_update`,
          payload: { votes: voteCounts },
        });
      }

      const uniqueTargets = [...new Set(Object.keys(voteCounts))];
      const allVoted = (wolfActions || []).length >= wolves.length;

      if (actionType === "werewolf_timeout") {
        // Host forced advance — resolve with majority (tie = random)
        let maxVotes = 0;
        let candidates: string[] = [];
        for (const [targetId, count] of Object.entries(voteCounts)) {
          if (count > maxVotes) { maxVotes = count; candidates = [targetId]; }
          else if (count === maxVotes) { candidates.push(targetId); }
        }
        const finalTarget = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : null;
        snapshot.nightActions = snapshot.nightActions || {};
        snapshot.nightActions.werewolvesTarget = finalTarget;
      } else if (allVoted && uniqueTargets.length === 1) {
        // Unanimous — advance
        snapshot.nightActions = snapshot.nightActions || {};
        snapshot.nightActions.werewolvesTarget = uniqueTargets[0];
      } else {
        // Not all voted yet, or not unanimous — wait
        return new Response(
          JSON.stringify({ received: true, waitingForOthers: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Store the action for all other action types
      await admin.from("actions").insert({
        game_id: gameId,
        player_id: player.id,
        action_type: actionType,
        payload: payload || {},
        phase: "night",
        turn: snapshot.turn || 1,
      });
    }

    // Handle seer action
    if (actionType === "seer_inspect" && currentStep === "seer") {
      const targetId = payload?.targetId;
      const target = (allPlayers || []).find((p: any) => p.id === targetId);
      snapshot.nightActions = snapshot.nightActions || {};
      snapshot.nightActions.seerTarget = targetId;

      seerResult = { role: target?.role || "unknown", name: target?.name || "?" };

      // Also broadcast privately (best-effort)
      await channel.send({
        type: "broadcast",
        event: `private:${player.id}:night:action_result`,
        payload: { result: seerResult },
      });
    }

    // Handle savior action
    if (actionType === "savior_protect" && currentStep === "savior") {
      snapshot.saviorTarget = payload?.targetId || null;
    }

    // Handle witch actions
    if (actionType === "witch_action" && currentStep === "witch") {
      snapshot.nightActions = snapshot.nightActions || {};
      if (payload?.heal) {
        snapshot.nightActions.witchHeal = true;
      }
      if (payload?.killTargetId) {
        snapshot.nightActions.witchKill = payload.killTargetId;
      }
    }

    // Handle cupid action
    if (actionType === "cupid_choose" && currentStep === "cupid") {
      const lover1 = payload?.lover1;
      const lover2 = payload?.lover2;
      snapshot.lovers = [lover1, lover2];

      // Will reveal to lovers in lovers_reveal step
    }

    // Handle raven action
    if (actionType === "raven_mark" && currentStep === "raven") {
      snapshot.ravenTarget = payload?.targetId || null;
    }

    // Advance to next step
    const nextStepIndex = nightStepIndex + 1;
    if (nextStepIndex >= nightSteps.length) {
      // Should not happen — resolution handles this
      return new Response(
        JSON.stringify({ error: "Night steps exhausted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nextStep = nightSteps[nextStepIndex];
    snapshot.nightStepIndex = nextStepIndex;
    snapshot.currentNightStep = nextStep;

    // Handle automatic steps
    if (nextStep === "lovers_reveal" && snapshot.lovers) {
      const [l1Id, l2Id] = snapshot.lovers;
      const l1 = (allPlayers || []).find((p: any) => p.id === l1Id);
      const l2 = (allPlayers || []).find((p: any) => p.id === l2Id);
      const isMixed = l1 && l2 &&
        ((l1.role === "werewolf") !== (l2.role === "werewolf"));

      await channel.send({
        type: "broadcast",
        event: `private:${l1Id}:lovers:reveal`,
        payload: { partnerName: l2?.name, isMixed },
      });
      await channel.send({
        type: "broadcast",
        event: `private:${l2Id}:lovers:reveal`,
        payload: { partnerName: l1?.name, isMixed },
      });

      // Auto-advance past lovers_reveal
      const afterLoversIndex = nextStepIndex + 1;
      if (afterLoversIndex < nightSteps.length) {
        snapshot.nightStepIndex = afterLoversIndex;
        snapshot.currentNightStep = nightSteps[afterLoversIndex];
      }
    }

    // Handle little_girl step (auto-generate clue)
    if (snapshot.currentNightStep === "little_girl") {
      const clueIds = generateLittleGirlClue(allPlayers || []);
      const clueNames = clueIds.map((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return p?.name || "???";
      });
      const littleGirl = (allPlayers || []).find((p: any) => p.role === "little_girl" && p.is_alive);
      if (littleGirl) {
        await channel.send({
          type: "broadcast",
          event: `private:${littleGirl.id}:little_girl:clue`,
          payload: { clueNames },
        });
      }
    }

    // Handle resolution step
    if (snapshot.currentNightStep === "resolution") {
      const nightActions = snapshot.nightActions || {};
      const deaths: string[] = [];
      let savedByWitch = false;
      let savedBySavior = false;
      let elderLostLife = false;
      let newElderLives = snapshot.elderLives ?? 2;
      const updatedPotions = { ...(snapshot.witchPotions || { life: true, death: true }) };

      const target = nightActions.werewolvesTarget;

      if (target) {
        let targetSaved = false;

        if (snapshot.saviorTarget === target) {
          targetSaved = true;
          savedBySavior = true;
        }

        if (!targetSaved) {
          const targetPlayer = (allPlayers || []).find((p: any) => p.id === target);
          if (targetPlayer?.role === "elder" && newElderLives > 1) {
            targetSaved = true;
            elderLostLife = true;
            newElderLives -= 1;
          }
        }

        if (!targetSaved && nightActions.witchHeal && updatedPotions.life) {
          targetSaved = true;
          savedByWitch = true;
          updatedPotions.life = false;
        }

        if (!targetSaved) {
          deaths.push(target);
        }
      }

      if (nightActions.witchKill && updatedPotions.death) {
        if (!deaths.includes(nightActions.witchKill)) {
          deaths.push(nightActions.witchKill);
        }
        updatedPotions.death = false;
      }

      // Lovers cascade
      let loversCascade: string | null = null;
      if (snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        for (const deadId of [...deaths]) {
          if (l1 === deadId && !deaths.includes(l2)) {
            loversCascade = l2;
            deaths.push(l2);
            break;
          } else if (l2 === deadId && !deaths.includes(l1)) {
            loversCascade = l1;
            deaths.push(l1);
            break;
          }
        }
      }

      // Apply deaths
      for (const deadId of deaths) {
        await admin
          .from("players")
          .update({ is_alive: false })
          .eq("id", deadId);
      }

      // Check hunter trigger
      const hunterTriggered = deaths.some((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return p?.role === "hunter";
      });

      // Check winner
      const updatedPlayers = (allPlayers || []).map((p: any) => ({
        ...p,
        is_alive: deaths.includes(p.id) ? false : p.is_alive,
      }));
      const aliveWolves = updatedPlayers.filter((p: any) => p.is_alive && p.role === "werewolf");
      const aliveVillagers = updatedPlayers.filter((p: any) => p.is_alive && p.role !== "werewolf");
      const aliveAll = updatedPlayers.filter((p: any) => p.is_alive);

      let winner: string | null = null;
      if (aliveWolves.length === 0) winner = "villagers";
      else if (aliveVillagers.length === 0) winner = "werewolves";

      if (!winner && snapshot.lovers) {
        const [l1, l2] = snapshot.lovers;
        const l1Player = updatedPlayers.find((p: any) => p.id === l1);
        const l2Player = updatedPlayers.find((p: any) => p.id === l2);
        if (l1Player && l2Player) {
          const isMixed = (l1Player.role === "werewolf") !== (l2Player.role === "werewolf");
          if (isMixed && l1Player.is_alive && l2Player.is_alive && aliveAll.length === 2) {
            winner = "lovers";
          }
        }
      }

      // Update snapshot
      snapshot.elderLives = newElderLives;
      snapshot.witchPotions = updatedPotions;
      snapshot.lastSaviorTarget = snapshot.saviorTarget;
      snapshot.nightDeaths = deaths;

      const deathDetails = deaths.map((id: string) => {
        const p = (allPlayers || []).find((pl: any) => pl.id === id);
        return { id, name: p?.name || "?" };
      });

      const aliveDetails = updatedPlayers
        .filter((p: any) => p.is_alive)
        .map((p: any) => ({ id: p.id, name: p.name }));

      // Determine next phase
      let nextPhase = "day";
      if (winner) nextPhase = "end";
      else if (hunterTriggered) nextPhase = "hunter";

      snapshot.nightActions = { werewolvesTarget: null, seerTarget: null, witchHeal: false, witchKill: null };
      snapshot.saviorTarget = null;
      snapshot.ravenTarget = snapshot.ravenTarget; // Persist for day vote
      snapshot.daySubPhase = "announcement";

      await admin
        .from("games")
        .update({
          phase: nextPhase,
          state_snapshot: snapshot,
          ...(winner ? { status: "finished" } : {}),
        })
        .eq("id", gameId);

      // Broadcast results
      await channel.send({
        type: "broadcast",
        event: "game:state",
        payload: {
          alivePlayers: aliveDetails,
          nightDeaths: deathDetails,
          winner,
        },
      });

      await channel.send({
        type: "broadcast",
        event: "game:phase",
        payload: { phase: nextPhase, turn: snapshot.turn || 1 },
      });

      return new Response(
        JSON.stringify({ resolved: true, deaths: deathDetails, winner }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Not resolution — send next step info
    // Broadcast step change to all
    await channel.send({
      type: "broadcast",
      event: "night:step",
      payload: { step: snapshot.currentNightStep },
    });

    // Send action_required to the active role player(s)
    const stepRole = STEP_ROLE_MAP[snapshot.currentNightStep];
    if (stepRole) {
      const activePlayers = (allPlayers || []).filter((p: any) =>
        p.is_alive && (Array.isArray(stepRole) ? stepRole.includes(p.role) : p.role === stepRole)
      );
      const targets = (allPlayers || [])
        .filter((p: any) => p.is_alive && p.id !== player.id)
        .map((p: any) => ({ id: p.id, name: p.name }));

      for (const activePlayer of activePlayers) {
        const actionPayload: any = {
          step: snapshot.currentNightStep,
          targets,
          instruction: STEP_INSTRUCTION[snapshot.currentNightStep] || "",
          timerSeconds: STEP_TIMER[snapshot.currentNightStep] || 15,
        };

        // Witch gets extra info
        if (snapshot.currentNightStep === "witch") {
          const wtarget = snapshot.nightActions?.werewolvesTarget;
          const wtargetPlayer = wtarget ? (allPlayers || []).find((p: any) => p.id === wtarget) : null;
          actionPayload.werewolfTarget = wtargetPlayer ? { id: wtargetPlayer.id, name: wtargetPlayer.name } : null;
          actionPayload.potions = snapshot.witchPotions || { life: true, death: true };
        }

        await channel.send({
          type: "broadcast",
          event: `private:${activePlayer.id}:night:action_required`,
          payload: actionPayload,
        });
      }
    }

    // Update snapshot in DB
    await admin
      .from("games")
      .update({ state_snapshot: snapshot })
      .eq("id", gameId);

    return new Response(
      JSON.stringify({ received: true, nextStep: snapshot.currentNightStep, ...(seerResult ? { seerResult } : {}) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
