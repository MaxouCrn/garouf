import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { gameId, daySubPhase, debateStartedAt, debateDurationMs } = await req.json();
    const admin = getSupabaseAdmin();

    const { data: game } = await admin.from("games").select("host_id, state_snapshot").eq("id", gameId).single();
    if (!game) return new Response(JSON.stringify({ error: "Game not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: hostPlayer } = await admin.from("players").select("id, user_id").eq("id", game.host_id).single();
    if (!hostPlayer || hostPlayer.user_id !== user.id) return new Response(JSON.stringify({ error: "Only host" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const snapshot = game.state_snapshot || {};
    snapshot.daySubPhase = daySubPhase;
    if (debateStartedAt) snapshot.debateStartedAt = debateStartedAt;
    if (debateDurationMs) snapshot.debateDurationMs = debateDurationMs;

    await admin.from("games").update({ state_snapshot: snapshot }).eq("id", gameId);

    return new Response(JSON.stringify({ updated: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
