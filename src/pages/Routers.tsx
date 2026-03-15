import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Router as RouterIcon, Settings, Wifi, WifiOff, Copy, Check, Link2, Download, RefreshCw, Trash2, MoreHorizontal, Eye, Power } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMikroTikScript } from "@/lib/mikrotik-script";

interface RouterDevice {
  id: string; name: string; location: string; ip_address: string; api_port: number;
  username: string; model: string; status: string; active_users: number;
  payment_destination: string; disable_sharing: boolean; device_tracking: boolean;
  bandwidth_control: boolean; session_logging: boolean; dns_name: string | null;
  hotspot_address: string | null; provision_token: string | null; org_id: string | null;
  created_at?: string; password?: string;
}

export default function Routers() {
  const [routers, setRouters] = useState<RouterDevice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState<RouterDevice | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "", location: "", ip_address: "192.168.88.1", api_port: 8728,
    username: "admin", password: "", dns_name: "hotspot.local",
    hotspot_address: "10.5.50.1/24", payment_destination: "Till",
    disable_sharing: false, device_tracking: true, bandwidth_control: true, session_logging: true,
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => { fetchRouters(); }, []);

  const fetchRouters = async () => {
    const { data, error } = await supabase.from("routers").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load routers");
    else setRouters((data as any[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: orgs } = await supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1);
    const orgId = orgs?.[0]?.id || null;
    const { error } = await supabase.from("routers").insert({
      user_id: user.id, org_id: orgId, name: form.name, location: form.location,
      ip_address: form.ip_address, api_port: form.api_port, username: form.username,
      password: form.password, dns_name: form.dns_name, hotspot_address: form.hotspot_address,
      payment_destination: form.payment_destination, disable_sharing: form.disable_sharing,
      device_tracking: form.device_tracking, bandwidth_control: form.bandwidth_control,
      session_logging: form.session_logging,
    } as any);
    if (error) toast.error("Failed to add router");
    else { toast.success("Router added!"); setDialogOpen(false); fetchRouters(); }
  };

  const deleteRouter = async (id: string) => {
    const { error } = await supabase.from("routers").delete().eq("id", id);
    if (error) toast.error("Failed to delete router");
    else { toast.success("Router deleted"); fetchRouters(); }
  };

  const getProvisionUrl = (token: string) => `${supabaseUrl}/functions/v1/provision-router?token=${token}`;
  const getMikroTikCommand = (token: string) => `/tool fetch url="${getProvisionUrl(token)}" mode=https dst-path=moonconnect.rsc\n/import moonconnect.rsc`;

  const refreshToken = async (routerId: string) => {
    const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const { error } = await supabase.from("routers").update({ provision_token: newToken } as any).eq("id", routerId);
    if (error) toast.error("Failed to refresh link");
    else {
      toast.success("Provision link refreshed!");
      fetchRouters();
      if (selectedRouter?.id === routerId) setSelectedRouter({ ...selectedRouter, provision_token: newToken });
    }
  };

  const downloadRsc = (router: RouterDevice) => {
    const portalUrl = window.location.origin + "/portal";
    const script = generateMikroTikScript({
      routerName: router.name, hotspotAddress: router.hotspot_address || "10.5.50.1/24",
      dnsName: router.dns_name || "hotspot.local", portalUrl, disableSharing: router.disable_sharing,
      deviceTracking: router.device_tracking, bandwidthControl: router.bandwidth_control, sessionLogging: router.session_logging,
    });
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "moonconnect.rsc"; a.click();
    URL.revokeObjectURL(url);
    toast.success("moonconnect.rsc downloaded!");
  };

  const openProvision = (router: RouterDevice) => { setSelectedRouter(router); setProvisionDialogOpen(true); setCopiedLink(false); setCopiedCmd(false); };
  const openDetail = (router: RouterDevice) => { setSelectedRouter(router); setDetailDialogOpen(true); };

  const copyToClipboard = async (text: string, type: "link" | "cmd") => {
    await navigator.clipboard.writeText(text);
    if (type === "link") { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 3000); }
    else { setCopiedCmd(true); setTimeout(() => setCopiedCmd(false), 3000); }
    toast.success("Copied to clipboard!");
  };

  return (
    <AdminLayout>
      <PageHeader title="Routers" subtitle="Manage MikroTik routers across locations">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-medium"><Plus className="w-4 h-4 mr-2" /> Add Router</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Add MikroTik Router</DialogTitle></DialogHeader>
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
              <Button className="w-full bg-primary text-primary-foreground" onClick={handleAdd}><Settings className="w-4 h-4 mr-2" /> Add Router</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Provision Dialog */}
      <Dialog open={provisionDialogOpen} onOpenChange={setProvisionDialogOpen}>
        <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" /> Provision — {selectedRouter?.name}</DialogTitle>
          </DialogHeader>
          {selectedRouter?.provision_token && (
            <div className="space-y-5 mt-2">
              <div>
                <h4 className="text-sm font-semibold mb-2">Option 1: Auto-Provision via Terminal</h4>
                <p className="text-xs text-muted-foreground mb-3">Paste in MikroTik Terminal. It downloads and runs the setup script automatically.</p>
                <div className="relative">
                  <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{getMikroTikCommand(selectedRouter.provision_token)}</pre>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyToClipboard(getMikroTikCommand(selectedRouter.provision_token!), "cmd")}>
                    {copiedCmd ? <Check className="w-3 h-3 mr-1 text-success" /> : <Copy className="w-3 h-3 mr-1" />} {copiedCmd ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Provision URL</h4>
                <div className="relative">
                  <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{getProvisionUrl(selectedRouter.provision_token)}</pre>
                  <Button size="sm" variant="outline" className="absolute top-1.5 right-1.5" onClick={() => copyToClipboard(getProvisionUrl(selectedRouter.provision_token!), "link")}>
                    {copiedLink ? <Check className="w-3 h-3 mr-1 text-success" /> : <Copy className="w-3 h-3 mr-1" />} {copiedLink ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Option 2: Download .rsc File</h4>
                <p className="text-xs text-muted-foreground mb-3">Upload to MikroTik Files, then run: <code className="text-primary">/import moonconnect.rsc</code></p>
                <Button variant="outline" size="sm" onClick={() => downloadRsc(selectedRouter)}><Download className="w-4 h-4 mr-2" /> Download moonconnect.rsc</Button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => refreshToken(selectedRouter.id)}><RefreshCw className="w-4 h-4 mr-1" /> Refresh Provision Link</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="glass-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <RouterIcon className="w-5 h-5 text-primary" /> {selectedRouter?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedRouter && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`font-medium ${selectedRouter.status === "Online" ? "text-success" : "text-destructive"}`}>{selectedRouter.status}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Active Users</p>
                  <p className="font-display font-bold text-primary">{selectedRouter.active_users}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="font-mono text-xs">{selectedRouter.ip_address}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">API Port</p>
                  <p className="font-mono text-xs">{selectedRouter.api_port}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p>{selectedRouter.model}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p>{selectedRouter.location || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">DNS Name</p>
                  <p className="font-mono text-xs">{selectedRouter.dns_name || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Hotspot Address</p>
                  <p className="font-mono text-xs">{selectedRouter.hotspot_address || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="font-mono text-xs">{selectedRouter.username}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p>{selectedRouter.payment_destination}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Sharing disabled</span><span>{selectedRouter.disable_sharing ? "Yes" : "No"}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Device tracking</span><span>{selectedRouter.device_tracking ? "Enabled" : "Disabled"}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Bandwidth control</span><span>{selectedRouter.bandwidth_control ? "Enabled" : "Disabled"}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Session logging</span><span>{selectedRouter.session_logging ? "Enabled" : "Disabled"}</span></div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => { setDetailDialogOpen(false); openProvision(selectedRouter); }}>
                  <Link2 className="w-3 h-3 mr-1" /> Provision
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadRsc(selectedRouter)}>
                  <Download className="w-3 h-3 mr-1" /> .rsc
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => { deleteRouter(selectedRouter.id); setDetailDialogOpen(false); }}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : routers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <RouterIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No routers yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first MikroTik router to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routers.map((r) => (
            <div key={r.id} className="glass-card p-5">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card border-border">
                    <DropdownMenuItem onClick={() => openDetail(r)}><Eye className="w-3.5 h-3.5 mr-2" /> View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openProvision(r)}><Link2 className="w-3.5 h-3.5 mr-2" /> Provision</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadRsc(r)}><Download className="w-3.5 h-3.5 mr-2" /> Download .rsc</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteRouter(r.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "Online" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{r.status}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono text-xs">{r.ip_address}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span>{r.model}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active Users</span><span className="font-display font-bold text-primary">{r.active_users}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openProvision(r)}><Link2 className="w-3 h-3 mr-1" /> Provision</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(r)}><Eye className="w-3 h-3 mr-1" /> Details</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
