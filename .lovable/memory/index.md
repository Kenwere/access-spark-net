MoonConnect WiFi billing platform for ISPs - design system, hosting, and architecture

## Branding
- Product name: MoonConnect (was HotSpot Pro)
- Multi-tenant ISP platform with subdomain routing

## Hosting
- Frontend: Vercel
- Backend: Railway (future)
- Database: Supabase (Lovable Cloud)

## Design
- Font display: JetBrains Mono
- Font body: Inter
- Primary: HSL 175 80% 45% (cyan/teal)
- Theme: dark default, light mode supported
- Glass morphism cards, grid pattern backgrounds
- gradient-primary, gradient-text, glass-card, glass-card-glow utilities

## Auth
- Auto-confirm email enabled
- Sample login: register with admin@gmail.com / admin123
- Roles: super_admin, admin, operator, support (stored in user_roles table)
- Auto-create profile + admin role + organization on signup via trigger
- ISP name captured at registration, generates subdomain

## Multi-Tenancy
- Organizations table links ISPs to their data
- org_id on routers, packages, payments, sessions, vouchers, settings
- Subdomain format: isp-name.moonconnect.app

## MikroTik Provisioning
- provision-router edge function serves .rsc scripts (no JWT, token-based auth)
- Router fetches via: /tool fetch url="..." mode=https dst-path=moonconnect.rsc
- Alternative: download moonconnect.rsc file from browser
- Provision token per router, refreshable
- Script configures: IP pool, DHCP, DNS, hotspot, walled garden, NAT, firewall, bandwidth, logging

## Payment Integrations (planned)
- Paystack, PesaPal, IntaSend
- Auto-connect on payment, auto-disconnect on expiry
