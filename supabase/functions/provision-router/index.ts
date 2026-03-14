import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateMikroTikScript(router: any, portalUrl: string) {
  const hotspotAddress = router.hotspot_address || "10.5.50.1/24";
  const dnsName = router.dns_name || "hotspot.local";
  const routerName = router.name;
  const networkBase = hotspotAddress.split("/")[0];
  const networkParts = networkBase.split(".");
  const poolStart = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.2`;
  const poolEnd = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.254`;
  const slug = routerName.toLowerCase().replace(/\s+/g, "-");
  const portalHost = new URL(portalUrl).hostname;

  let script = `# ============================================
# MoonConnect - MikroTik Auto Setup Script
# Router: ${routerName}
# Generated: ${new Date().toISOString()}
# ============================================
# This script was auto-downloaded from MoonConnect
# ============================================

# --- IP Pool ---
/ip pool
add name=hotspot-pool ranges=${poolStart}-${poolEnd}

# --- Interface IP ---
/ip address
add address=${hotspotAddress} interface=ether2 comment="MoonConnect Interface"

# --- DHCP Server ---
/ip dhcp-server network
add address=${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.0/24 gateway=${networkBase} dns-server=${networkBase}
/ip dhcp-server
add name=hotspot-dhcp interface=ether2 address-pool=hotspot-pool lease-time=1h disabled=no

# --- DNS ---
/ip dns
set allow-remote-requests=yes servers=8.8.8.8,8.8.4.4
/ip dns static
add name=${dnsName} address=${networkBase}

# --- Hotspot Profile ---
/ip hotspot profile
add name=hsprof-moonconnect hotspot-address=${networkBase} dns-name=${dnsName} \\
  html-directory=hotspot login-by=http-chap,http-pap,cookie,mac-cookie \\
  http-cookie-lifetime=1d rate-limit=""

/ip hotspot
add name=hotspot-${slug} interface=ether2 address-pool=hotspot-pool \\
  profile=hsprof-moonconnect disabled=no

# --- Walled Garden (Allow Portal Access) ---
/ip hotspot walled-garden ip
add dst-host=${portalHost} action=accept comment="MoonConnect Portal"
add dst-address=0.0.0.0/0 dst-port=443 protocol=tcp action=accept comment="HTTPS for payment"

/ip hotspot walled-garden
add dst-host=${portalHost} path=/* action=allow comment="MoonConnect Portal Page"

# --- NAT / Masquerade ---
/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade comment="MoonConnect NAT"

# --- Firewall Rules ---
/ip firewall filter
add chain=input protocol=tcp dst-port=8728,8729 action=accept comment="Allow RouterOS API"
add chain=forward action=accept connection-state=established,related comment="Allow established"
add chain=forward action=accept in-interface=ether2 comment="Allow hotspot traffic"
`;

  if (router.disable_sharing) {
    script += `
# --- Disable Hotspot Sharing (1 device per login) ---
/ip hotspot profile set hsprof-moonconnect shared-users=1
`;
  }

  if (router.device_tracking) {
    script += `
# --- Device Tracking ---
/ip hotspot profile set hsprof-moonconnect login-by=http-chap,http-pap,cookie,mac-cookie
/ip hotspot set hotspot-${slug} addresses-per-mac=1
`;
  }

  if (router.bandwidth_control) {
    script += `
# --- Bandwidth Control Queues ---
/queue type
add name=hotspot-default kind=pcq pcq-rate=0 pcq-limit=50 pcq-classifier=dst-address
/queue simple
add name=hotspot-queue target=${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.0/24 queue=hotspot-default/hotspot-default comment="MoonConnect BW Control"
`;
  }

  if (router.session_logging) {
    script += `
# --- Session Logging ---
/system logging
add topics=hotspot action=memory
add topics=hotspot action=echo
`;
  }

  script += `
# --- Default User Profile ---
/ip hotspot user profile
add name=default shared-users=1 rate-limit=2M/2M

# --- Captive Portal Redirect ---
# Users will be redirected to: ${portalUrl}

# ============================================
# SETUP COMPLETE! MoonConnect is ready.
# ============================================
`;

  return script;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing provision token", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: router, error } = await supabase
    .from("routers")
    .select("*")
    .eq("provision_token", token)
    .single();

  if (error || !router) {
    return new Response("# Invalid provision token\n", {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  // Get org subdomain for portal URL
  let portalUrl = "https://moonconnect.app/portal";
  if (router.org_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("subdomain")
      .eq("id", router.org_id)
      .single();
    if (org) {
      portalUrl = `https://${org.subdomain}.moonconnect.app/portal`;
    }
  }

  const script = generateMikroTikScript(router, portalUrl);

  return new Response(script, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="moonconnect.rsc"',
    },
  });
});
