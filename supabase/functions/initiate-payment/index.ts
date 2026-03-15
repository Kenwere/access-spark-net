import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { org_id, phone, amount, package_name, package_id, duration_minutes, payment_method } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get org settings for payment credentials
    const { data: settings, error: settingsErr } = await supabase
      .from("settings").select("*").eq("org_id", org_id).single();

    if (settingsErr || !settings) {
      return new Response(JSON.stringify({ error: "Organization settings not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = Deno.env.get("SUPABASE_URL");
    let paymentResult: any = {};

    if (payment_method === "paystack" && settings.paystack_secret_key) {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.paystack_secret_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          email: `${phone.replace(/[^0-9]/g, "")}@hotspot.local`,
          currency: "KES",
          callback_url: `${baseUrl}/functions/v1/payment-webhook?provider=paystack&org_id=${org_id}`,
          metadata: { phone, package_name, package_id, org_id, duration_minutes },
        }),
      });
      const data = await res.json();
      if (!data.status) throw new Error(data.message || "Paystack initialization failed");
      paymentResult = { authorization_url: data.data.authorization_url, reference: data.data.reference, provider: "paystack" };

    } else if (payment_method === "intasend" && settings.intasend_secret_key) {
      const res = await fetch("https://payment.intasend.com/api/v1/payment/mpesa-stk-push/", {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.intasend_secret_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, phone_number: phone,
          api_ref: `mc-${Date.now()}`,
          narrative: `WiFi - ${package_name}`,
        }),
      });
      const data = await res.json();
      paymentResult = { invoice_id: data.invoice?.invoice_id, provider: "intasend", status: "stk_sent" };

    } else if (payment_method === "pesapal" && settings.pesapal_consumer_key) {
      // PesaPal OAuth + order submission
      const tokenRes = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ consumer_key: settings.pesapal_consumer_key, consumer_secret: settings.pesapal_consumer_secret }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.token) throw new Error("PesaPal auth failed");

      const orderRes = await fetch("https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenData.token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          currency: "KES",
          amount,
          description: `WiFi - ${package_name}`,
          callback_url: `${baseUrl}/functions/v1/payment-webhook?provider=pesapal&org_id=${org_id}`,
          billing_address: { phone_number: phone },
        }),
      });
      const orderData = await orderRes.json();
      paymentResult = { redirect_url: orderData.redirect_url, order_tracking_id: orderData.order_tracking_id, provider: "pesapal" };
    } else {
      return new Response(JSON.stringify({ error: "No valid payment method configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pending payment record
    const expiresAt = new Date(Date.now() + (duration_minutes || 120) * 60 * 1000).toISOString();
    await supabase.from("payments").insert({
      user_id: settings.user_id, org_id, phone, package_name, amount,
      method: payment_method, status: "Pending",
      transaction_id: paymentResult.reference || paymentResult.invoice_id || paymentResult.order_tracking_id || null,
      session_expiry: expiresAt,
    });

    return new Response(JSON.stringify(paymentResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
