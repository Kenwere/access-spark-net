import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Router as RouterIcon, Settings, Wifi, WifiOff, Copy, Check, Terminal, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMikroTikScript } from "@/lib/mikrotik-script";

interface RouterDevice {
  id: string;
  name: string;
  location: string;
  ip_address: string;
  api_port: number;
  username: string;
  model: string;
  status: string;
  active_users: number;
  payment_destination: string;
  disable_sharing: boolean;
  device_tracking: boolean;
  bandwidth_control: boolean;
  session_logging: boolean;
  dns_name: string | null;
  hotspot_address: string | null;
}

export default function Routers() {
  const [routers, setRouters] = useState<RouterDevice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState<RouterDevice | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: "", location: "", ip_address: "192.168.88.1", api_port: 8728,
    username: "admin", password: "", dns_name: "hotspot.local",
    hotspot_address: "10.5.50.1/24", payment_destination: "Till",
    disable_sharing: false, device_tracking: true, bandwidth_control: true, session_logging: true,
  });

  const portalUrl = window.location.origin + "/portal";

  useEffect(() => { fetchRouters(); }, []);

  const fetchRouters = async () => {
    const { data, error } = await supabase.from("routers").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load routers"); }
    else { setRouters((data as any[]) || []); }
    setLoading(false);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("routers").insert({
      user_id: user.id, name: form.name, location: form.location,
      ip_address: form.ip_address, api_port: form.api_port, username: form.username,
      password: form.password, dns_name: form.dns_name, hotspot_address: form.hotspot_address,
      payment_destination: form.payment_destination, disable_sharing: form.disable_sharing,
      device_tracking: form.device_tracking, bandwidth_control: form.bandwidth_control,
      session_logging: form.session_logging,
    } as any);
    if (error) { toast.error("Failed to add router"); }
    else { toast.success("Router added!"); setDialogOpen(false); fetchRouters(); }
  };

  const openScript = (router: RouterDevice) => {
    setSelectedRouter(router);
    setScriptDialogOpen(true);
    setCopied(false);
  };

  const getScript = () => {
    if (!selectedRouter) return "";
    return generateMikroTikScript({
      routerName: selectedRouter.name,
      hotspotAddress: selectedRouter.hotspot_address || "10.5.50.1/24",
      dnsName: selectedRouter.dns_name || "hotspot.local",
      portalUrl,
      disableSharing: selectedRouter.disable_sharing,
      deviceTracking: selectedRouter.device_tracking,
      bandwidthControl: selectedRouter.bandwidth_control,
      sessionLogging: selectedRouter.session_logging,
    });
  };

  const copyScript = async () => {
    await navigator.clipboard.writeText(getScript());
    setCopied(true);
    toast.success("Script copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AdminLayout>
      <PageHeader title="Routers" subtitle="Manage MikroTik routers across locations">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-medium">
              <Plus className="w-4 h-4 mr-2" /> Add Router
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Add MikroTik Router</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Router Name</Label><Input placeholder="e.g. Main Router" className="mt-1.5" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Location</Label><Input placeholder="e.g. Cafe" className="mt-1.5" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>IP Address</Label><Input placeholder="192.168.88.1" className="mt-1.5" value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} /></div>
                <div><Label>API Port</Label><Input type="number" placeholder="8728" className="mt-1.5" value={form.api_port} onChange={e => setForm(f => ({ ...f, api_port: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Username</Label><Input placeholder="admin" className="mt-1.5" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
                <div><Label>Password</Label><Input type="password" className="mt-1.5" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>DNS Name</Label><Input placeholder="hotspot.local" className="mt-1.5" value={form.dns_name} onChange={e => setForm(f => ({ ...f, dns_name: e.target.value }))} /></div>
                <div><Label>Hotspot Address</Label><Input placeholder="10.5.50.1/24" className="mt-1.5" value={form.hotspot_address} onChange={e => setForm(f => ({ ...f, hotspot_address: e.target.value }))} /></div>
              </div>
              <div><Label>Payment Destination</Label><Input placeholder="Till / Paybill" className="mt-1.5" value={form.payment_destination} onChange={e => setForm(f => ({ ...f, payment_destination: e.target.value }))} /></div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between"><Label>Disable hotspot sharing</Label><Switch checked={form.disable_sharing} onCheckedChange={v => setForm(f => ({ ...f, disable_sharing: v }))} /></div>
                <div className="flex items-center justify-between"><Label>Enable device tracking</Label><Switch checked={form.device_tracking} onCheckedChange={v => setForm(f => ({ ...f, device_tracking: v }))} /></div>
                <div className="flex items-center justify-between"><Label>Enable bandwidth control</Label><Switch checked={form.bandwidth_control} onCheckedChange={v => setForm(f => ({ ...f, bandwidth_control: v }))} /></div>
                <div className="flex items-center justify-between"><Label>Enable session logging</Label><Switch checked={form.session_logging} onCheckedChange={v => setForm(f => ({ ...f, session_logging: v }))} /></div>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={handleAdd}>
                <Settings className="w-4 h-4 mr-2" /> Add Router
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Script Dialog */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              MikroTik Setup Script — {selectedRouter?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copy this script and paste it into your MikroTik terminal (System → Terminal). It will auto-configure everything.
          </p>
          <div className="relative mt-2">
            <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre">
              {getScript()}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={copyScript}
            >
              {copied ? <Check className="w-4 h-4 mr-1 text-success" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => { setCopied(false); setSelectedRouter({ ...selectedRouter! }); }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Regenerate Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : routers.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <RouterIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No routers yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first MikroTik router to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routers.map((r) => (
            <div key={r.id} className="glass-card-glow rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.status === "Online" ? "bg-success/15" : "bg-muted"}`}>
                    {r.status === "Online" ? <Wifi className="w-5 h-5 text-success" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === "Online" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{r.status}</span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono text-xs">{r.ip_address}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span>{r.model}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active Users</span><span className="font-display font-bold text-primary">{r.active_users}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{r.payment_destination}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openScript(r)}>
                  <Terminal className="w-3 h-3 mr-1" /> Get Script
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="w-3 h-3 mr-1" /> Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
