// Generates a MikroTik RouterOS script for hotspot auto-setup
export function generateMikroTikScript(options: {
  routerName: string;
  hotspotAddress?: string;
  dnsName?: string;
  portalUrl: string;
  disableSharing?: boolean;
  deviceTracking?: boolean;
  bandwidthControl?: boolean;
  sessionLogging?: boolean;
}) {
  const {
    routerName,
    hotspotAddress = "10.5.50.1/24",
    dnsName = "hotspot.local",
    portalUrl,
    disableSharing = false,
    deviceTracking = true,
    bandwidthControl = true,
    sessionLogging = true,
  } = options;

  const networkBase = hotspotAddress.split("/")[0];
  const networkParts = networkBase.split(".");
  const poolStart = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.2`;
  const poolEnd = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.254`;

  return `# ============================================
# HotSpot Pro - MikroTik Auto Setup Script
# Router: ${routerName}
# Generated: ${new Date().toISOString()}
# ============================================
# Paste this entire script into MikroTik Terminal
# (System > Terminal) and press Enter
# ============================================

# --- Step 1: Create IP Pool ---
/ip pool
add name=hotspot-pool ranges=${poolStart}-${poolEnd}

# --- Step 2: Set Interface IP ---
/ip address
add address=${hotspotAddress} interface=ether2 comment="HotSpot Pro Interface"

# --- Step 3: DHCP Server ---
/ip dhcp-server network
add address=${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.0/24 gateway=${networkBase} dns-server=${networkBase}
/ip dhcp-server
add name=hotspot-dhcp interface=ether2 address-pool=hotspot-pool lease-time=1h disabled=no

# --- Step 4: DNS ---
/ip dns
set allow-remote-requests=yes servers=8.8.8.8,8.8.4.4
/ip dns static
add name=${dnsName} address=${networkBase}

# --- Step 5: Hotspot Setup ---
/ip hotspot profile
add name=hsprof-hotspotpro hotspot-address=${networkBase} dns-name=${dnsName} \\
  html-directory=hotspot login-by=http-chap,http-pap,cookie,mac-cookie \\
  http-cookie-lifetime=1d rate-limit=""

/ip hotspot
add name=hotspot-${routerName.toLowerCase().replace(/\s+/g, "-")} interface=ether2 address-pool=hotspot-pool \\
  profile=hsprof-hotspotpro disabled=no

# --- Step 6: Walled Garden (Allow Portal Access) ---
/ip hotspot walled-garden ip
add dst-host=${new URL(portalUrl).hostname} action=accept comment="HotSpot Pro Portal"
add dst-address=0.0.0.0/0 dst-port=443 protocol=tcp action=accept comment="HTTPS for payment"

/ip hotspot walled-garden
add dst-host=${new URL(portalUrl).hostname} path=/* action=allow comment="HotSpot Pro Portal Page"

# --- Step 7: NAT / Masquerade ---
/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade comment="HotSpot Pro NAT"

# --- Step 8: Firewall Rules ---
/ip firewall filter
add chain=input protocol=tcp dst-port=8728,8729 action=accept comment="Allow RouterOS API"
add chain=forward action=accept connection-state=established,related comment="Allow established"
add chain=forward action=accept in-interface=ether2 comment="Allow hotspot traffic"
${disableSharing ? `
# --- Disable Hotspot Sharing (1 device per login) ---
/ip hotspot profile set hsprof-hotspotpro shared-users=1` : ""}
${deviceTracking ? `
# --- Device Tracking ---
/ip hotspot profile set hsprof-hotspotpro login-by=http-chap,http-pap,cookie,mac-cookie
/ip hotspot set hotspot-${routerName.toLowerCase().replace(/\s+/g, "-")} addresses-per-mac=1` : ""}
${bandwidthControl ? `
# --- Bandwidth Control Queues ---
/queue type
add name=hotspot-default kind=pcq pcq-rate=0 pcq-limit=50 pcq-classifier=dst-address
/queue simple
add name=hotspot-queue target=${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.0/24 queue=hotspot-default/hotspot-default comment="HotSpot Pro BW Control"` : ""}
${sessionLogging ? `
# --- Session Logging ---
/system logging
add topics=hotspot action=memory
add topics=hotspot action=echo` : ""}

# --- Step 9: Hotspot User Profile (default) ---
/ip hotspot user profile
add name=default shared-users=1 rate-limit=2M/2M

# --- Step 10: Set Login Page Redirect ---
# The captive portal will redirect users to:
# ${portalUrl}
# You can customize the hotspot HTML login page to redirect here.

# ============================================
# SETUP COMPLETE!
# Users connecting to ether2 will see the
# HotSpot Pro captive portal.
# ============================================
`;
}
