MoonConnect WiFi billing system - design system and hosting preferences

## Hosting
- Frontend: Vercel (wildcard subdomain for multi-tenant)
- Backend: Lovable Cloud

## Design
- Font display: JetBrains Mono
- Font body: Inter
- Primary: HSL 199 89% 48% (professional blue)
- Theme: dark default, light mode supported
- NO gradients - solid colors only, professional look
- glass-card utility (solid bg-card, border, shadow-sm)
- Branding: MoonConnect (not HotSpot Pro)

## Auth
- Auto-confirm email enabled
- Roles: super_admin, admin, operator, support (stored in user_roles table)
- Auto-create profile + org + admin role on signup via trigger
- org_id added to profiles for team membership

## Multi-tenant
- Organizations table with subdomain field
- ISP registers → auto-creates org with subdomain
- Settings per org (payment credentials, branding, portal theme)
- Portal accessed via ?org=subdomain or subdomain.moonconnect.app

## Portal Themes
- 10 themes: classic, midnight, emerald, sunset, rose, ocean, clean, purple, slate, neon
- ISP selects theme in Settings, stored as portal_theme in settings table
- Themes defined in src/lib/portal-themes.ts

## Payment Gateways
- Paystack, IntaSend, PesaPal supported
- Credentials stored in settings table per org
- Edge functions: initiate-payment, payment-webhook, expire-sessions

## MikroTik
- provision-router edge function serves .rsc scripts via token URL
- Supports both hotspot and PPPoE (connection_type on routers table)

## Session Management
- expire-sessions runs every minute via pg_cron
- Auto-disconnect when expires_at < now()
- Manual: disconnect, extend, delete, add free user
