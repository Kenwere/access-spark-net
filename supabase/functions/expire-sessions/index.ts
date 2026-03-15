import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date().toISOString();

    // Find active sessions past their expiry
    const { data: expired, error: fetchErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("status", "Active")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (fetchErr) throw fetchErr;

    if (expired && expired.length > 0) {
      const ids = expired.map((s: any) => s.id);
      const { error: updateErr } = await supabase
        .from("sessions")
        .update({ status: "Expired", logout_time: now })
        .in("id", ids);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ expired_count: ids.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ expired_count: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Expire sessions error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
