import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
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

    const { name, settings, devCode } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    let code: string;
    if (devCode && typeof devCode === "string") {
      // Dev mode: use requested code, clean up ALL old games with same code
      code = devCode.toUpperCase();
      const { data: oldGames } = await admin
        .from("games")
        .select("id")
        .eq("code", code);
      for (const oldGame of oldGames || []) {
        await admin.from("actions").delete().eq("game_id", oldGame.id);
        await admin.from("games").update({ host_id: null }).eq("id", oldGame.id);
        await admin.from("players").delete().eq("game_id", oldGame.id);
        await admin.from("games").delete().eq("id", oldGame.id);
      }
    } else {
      let codeExists = true;
      do {
        code = generateCode();
        const { data } = await admin
          .from("games")
          .select("id")
          .eq("code", code)
          .neq("status", "finished")
          .maybeSingle();
        codeExists = data !== null;
      } while (codeExists);
    }

    const { data: game, error: gameError } = await admin
      .from("games")
      .insert({
        code,
        status: "lobby",
        phase: null,
        settings: settings ?? { selectedRoles: [], debateTimerMinutes: 3 },
      })
      .select("id, code")
      .single();

    if (gameError) throw gameError;

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

    await admin
      .from("games")
      .update({ host_id: player.id })
      .eq("id", game.id);

    return new Response(
      JSON.stringify({ gameId: game.id, code: game.code, playerId: player.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
