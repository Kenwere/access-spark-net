import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");
    const orgId = url.searchParams.get("org_id");
    const body = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let transactionId = "";
    let phone = "";
    let packageName = "";
    let amount = 0;
    let durationMinutes = 120;
    let verified = false;

    if (provider === "paystack") {
      // Paystack sends event data
      const event = body.event;
      const data = body.data;
      if (event === "charge.success") {
        transactionId = data.reference;
        phone = data.metadata?.phone || "";
        packageName = data.metadata?.package_name || "";
        amount = (data.amount || 0) / 100;
        durationMinutes = data.metadata?.duration_minutes || 120;
        verified = true;
      }
    } else if (provider === "intasend") {
      // IntaSend webhook
      if (body.state === "COMPLETE") {
        transactionId = body.api_ref || body.invoice_id || "";
        phone = body.account || "";
        amount = body.value || 0;
        verified = true;
      }
    } else if (provider === "pesapal") {
      // PesaPal IPN
      transactionId = body.OrderTrackingId || body.order_tracking_id || "";
      if (body.payment_status_description === "Completed" || body.status_code === 1) {
        amount = body.amount || 0;
        verified = true;
      }
    }

    if (verified && transactionId) {
      // Update payment status
      const { data: payment } = await supabase
        .from("payments")
        .update({ status: "Completed" })
        .eq("transaction_id", transactionId)
        .select()
        .single();

      if (payment) {
        // Create active session (auto-connect)
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
        await supabase.from("sessions").insert({
          user_id: (payment as any).user_id,
          org_id: orgId,
          phone: (payment as any).phone || phone,
          package_name: (payment as any).package_name || packageName,
          status: "Active",
          login_time: new Date().toISOString(),
          expires_at: expiresAt,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
