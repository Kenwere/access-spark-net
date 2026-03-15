import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, CreditCard, Shield, Palette, Loader as Loader2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState("");

  const [form, setForm] = useState({
    business_name: "", business_logo_url: "", support_phone: "", welcome_message: "",
    primary_color: "#0ea5e9", background_style: "dark",
    default_payment_method: "till", till_number: "", paybill_number: "", account_number: "",
    intasend_pub_key: "", intasend_secret_key: "", pesapal_consumer_key: "", pesapal_consumer_secret: "",
    paystack_pub_key: "", paystack_secret_key: "",
    enable_mpesa_till: true, enable_mpesa_paybill: false, enable_paystack: false, enable_intasend: false, enable_pesapal: false,
    mac_binding: true, auto_disconnect: true, allow_session_resume: true, enable_https: true,
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [settingsRes, orgRes] = await Promise.all([
        supabase.from("settings").select("*").eq("user_id", user.id).limit(1).single(),
        supabase.from("organizations").select("subdomain").eq("owner_id", user.id).limit(1).single(),
      ]);
      if (orgRes.data) setSubdomain(orgRes.data.subdomain);
      if (settingsRes.data) {
        const s = settingsRes.data as any;
        setSettingsId(s.id);
        setForm({
          business_name: s.business_name || "", business_logo_url: s.business_logo_url || "",
          support_phone: s.support_phone || "", welcome_message: s.welcome_message || "",
          primary_color: s.primary_color || "#0ea5e9", background_style: s.background_style || "dark",
          default_payment_method: s.default_payment_method || "till",
          till_number: s.till_number || "", paybill_number: s.paybill_number || "", account_number: s.account_number || "",
          intasend_pub_key: s.intasend_pub_key || "", intasend_secret_key: s.intasend_secret_key || "",
          pesapal_consumer_key: s.pesapal_consumer_key || "", pesapal_consumer_secret: s.pesapal_consumer_secret || "",
          paystack_pub_key: s.paystack_pub_key || "", paystack_secret_key: s.paystack_secret_key || "",
          enable_mpesa_till: s.enable_mpesa_till ?? true, enable_mpesa_paybill: s.enable_mpesa_paybill ?? false,
          enable_paystack: s.enable_paystack ?? false, enable_intasend: s.enable_intasend ?? false,
          enable_pesapal: s.enable_pesapal ?? false,
          mac_binding: s.mac_binding ?? true, auto_disconnect: s.auto_disconnect ?? true,
          allow_session_resume: s.allow_session_resume ?? true, enable_https: s.enable_https ?? true,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase.from("settings").update(form as any).eq("id", settingsId);
    if (error) toast.error("Failed to save settings");
    else toast.success("Settings saved!");
    setSaving(false);
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <PageHeader title="Settings" subtitle="Configure your hotspot system" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Business Settings</h3>
          </div>
          <div className="space-y-4">
            <div><Label>Business Name</Label><Input placeholder="Your Business Name" className="mt-1.5" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} /></div>
            <div><Label>Business Logo URL</Label><Input placeholder="https://..." className="mt-1.5" value={form.business_logo_url} onChange={e => setForm(f => ({ ...f, business_logo_url: e.target.value }))} /></div>
            <div><Label>Support Phone</Label><Input placeholder="+254712345678" className="mt-1.5" value={form.support_phone} onChange={e => setForm(f => ({ ...f, support_phone: e.target.value }))} /></div>
            <div><Label>Welcome Message</Label><Input placeholder="Welcome to fast, reliable WiFi!" className="mt-1.5" value={form.welcome_message} onChange={e => setForm(f => ({ ...f, welcome_message: e.target.value }))} /></div>
            <div className="pt-3 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Portal Theme</h4>
              <div className="space-y-3">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="w-20 h-10" />
                    <Input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Background Style</Label>
                  <Select value={form.background_style} onValueChange={v => setForm(f => ({ ...f, background_style: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="light">Light Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Payment Configuration</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Default Payment Method</Label>
              <Select value={form.default_payment_method} onValueChange={v => setForm(f => ({ ...f, default_payment_method: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="till">M-Pesa Till Number</SelectItem>
                  <SelectItem value="paybill">M-Pesa Paybill</SelectItem>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="intasend">IntaSend</SelectItem>
                  <SelectItem value="pesapal">PesaPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Till / Paybill Number</Label><Input placeholder="123456" className="mt-1.5" value={form.till_number || form.paybill_number} onChange={e => setForm(f => ({ ...f, till_number: e.target.value, paybill_number: e.target.value }))} /></div>
            <div><Label>Account Number (if Paybill)</Label><Input placeholder="Optional" className="mt-1.5" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} /></div>
            <div className="pt-3 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Payment Gateway Credentials</h4>
              <div className="space-y-3">
                <div><Label>Paystack Public Key</Label><Input placeholder="pk_..." className="mt-1.5" value={form.paystack_pub_key} onChange={e => setForm(f => ({ ...f, paystack_pub_key: e.target.value }))} /></div>
                <div><Label>Paystack Secret Key</Label><Input type="password" placeholder="sk_..." className="mt-1.5" value={form.paystack_secret_key} onChange={e => setForm(f => ({ ...f, paystack_secret_key: e.target.value }))} /></div>
                <div><Label>IntaSend Publishable Key</Label><Input placeholder="ISPubKey_..." className="mt-1.5" value={form.intasend_pub_key} onChange={e => setForm(f => ({ ...f, intasend_pub_key: e.target.value }))} /></div>
                <div><Label>IntaSend Secret Key</Label><Input type="password" placeholder="ISSecretKey_..." className="mt-1.5" value={form.intasend_secret_key} onChange={e => setForm(f => ({ ...f, intasend_secret_key: e.target.value }))} /></div>
                <div><Label>PesaPal Consumer Key</Label><Input placeholder="Consumer Key" className="mt-1.5" value={form.pesapal_consumer_key} onChange={e => setForm(f => ({ ...f, pesapal_consumer_key: e.target.value }))} /></div>
                <div><Label>PesaPal Consumer Secret</Label><Input type="password" placeholder="Consumer Secret" className="mt-1.5" value={form.pesapal_consumer_secret} onChange={e => setForm(f => ({ ...f, pesapal_consumer_secret: e.target.value }))} /></div>
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t border-border">
              <h4 className="text-sm font-medium mb-1">Enable Payment Methods</h4>
              <div className="flex items-center justify-between"><Label>Enable M-Pesa Till</Label><Switch checked={form.enable_mpesa_till} onCheckedChange={v => setForm(f => ({ ...f, enable_mpesa_till: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Enable M-Pesa Paybill</Label><Switch checked={form.enable_mpesa_paybill} onCheckedChange={v => setForm(f => ({ ...f, enable_mpesa_paybill: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Enable Paystack</Label><Switch checked={form.enable_paystack} onCheckedChange={v => setForm(f => ({ ...f, enable_paystack: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Enable IntaSend</Label><Switch checked={form.enable_intasend} onCheckedChange={v => setForm(f => ({ ...f, enable_intasend: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Enable PesaPal</Label><Switch checked={form.enable_pesapal} onCheckedChange={v => setForm(f => ({ ...f, enable_pesapal: v }))} /></div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Require MAC binding</Label><Switch checked={form.mac_binding} onCheckedChange={v => setForm(f => ({ ...f, mac_binding: v }))} /></div>
            <div className="flex items-center justify-between"><Label>Auto-disconnect on expiry</Label><Switch checked={form.auto_disconnect} onCheckedChange={v => setForm(f => ({ ...f, auto_disconnect: v }))} /></div>
            <div className="flex items-center justify-between"><Label>Allow session resume</Label><Switch checked={form.allow_session_resume} onCheckedChange={v => setForm(f => ({ ...f, allow_session_resume: v }))} /></div>
            <div className="flex items-center justify-between"><Label>Enable HTTPS</Label><Switch checked={form.enable_https} onCheckedChange={v => setForm(f => ({ ...f, enable_https: v }))} /></div>
          </div>
        </div>

        {/* Subdomain Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Your Portal</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subdomain</span><span className="font-mono text-primary">{subdomain}.moonconnect.app</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Portal URL</span><span className="font-mono text-xs">https://{subdomain}.moonconnect.app/portal</span></div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">Configure your Vercel project with wildcard subdomain routing to enable ISP-specific portals.</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button className="bg-primary text-primary-foreground font-medium" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
        </Button>
      </div>
    </AdminLayout>
  );
}
