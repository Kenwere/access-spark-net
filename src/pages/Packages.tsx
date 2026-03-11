import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, CreditCard as Edit, Trash2, Zap, Package as PackageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pkg {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  duration_label: string;
  speed_limit: string | null;
  data_limit: string | null;
  active: boolean;
}

export default function Packages() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", price: "", duration_label: "", duration_minutes: "", speed_limit: "", data_limit: "" });

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
    if (!error) setPackages((data as any[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("packages").insert({
      user_id: user.id, name: form.name, price: Number(form.price),
      duration_label: form.duration_label, duration_minutes: Number(form.duration_minutes) || 120,
      speed_limit: form.speed_limit || null, data_limit: form.data_limit || null,
    } as any);
    if (error) toast.error("Failed to create package");
    else { toast.success("Package created!"); setDialogOpen(false); fetchPackages(); setForm({ name: "", price: "", duration_label: "", duration_minutes: "", speed_limit: "", data_limit: "" }); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("packages").update({ active: !active } as any).eq("id", id);
    fetchPackages();
  };

  const deletePackage = async (id: string) => {
    await supabase.from("packages").delete().eq("id", id);
    toast.success("Package deleted");
    fetchPackages();
  };

  return (
    <AdminLayout>
      <PageHeader title="Packages" subtitle="Manage internet access packages">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-medium"><Plus className="w-4 h-4 mr-2" /> Add Package</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle className="font-display">Create Package</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Package Name</Label><Input placeholder="e.g. Quick Browse" className="mt-1.5" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (KSH)</Label><Input type="number" placeholder="15" className="mt-1.5" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><Label>Duration Label</Label><Input placeholder="e.g. 2 Hours" className="mt-1.5" value={form.duration_label} onChange={e => setForm(f => ({ ...f, duration_label: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Duration (minutes)</Label><Input type="number" placeholder="120" className="mt-1.5" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
                <div><Label>Speed Limit</Label><Input placeholder="e.g. 5 Mbps" className="mt-1.5" value={form.speed_limit} onChange={e => setForm(f => ({ ...f, speed_limit: e.target.value }))} /></div>
              </div>
              <div><Label>Data Limit</Label><Input placeholder="e.g. 5 GB" className="mt-1.5" value={form.data_limit} onChange={e => setForm(f => ({ ...f, data_limit: e.target.value }))} /></div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={handleAdd}>Create Package</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : packages.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No packages yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first internet access package to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`glass-card-glow rounded-xl p-5 transition-all ${!pkg.active && "opacity-50"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /><h3 className="font-display font-semibold text-sm">{pkg.name}</h3></div>
                <Switch checked={pkg.active} onCheckedChange={() => toggleActive(pkg.id, pkg.active)} />
              </div>
              <p className="text-3xl font-display font-bold gradient-text mb-1">KSH {pkg.price}</p>
              <p className="text-sm text-muted-foreground mb-4">{pkg.duration_label}</p>
              <div className="flex gap-2 text-xs text-muted-foreground mb-4">
                {pkg.speed_limit && <span className="px-2 py-1 rounded-md bg-muted">{pkg.speed_limit}</span>}
                {pkg.data_limit && <span className="px-2 py-1 rounded-md bg-muted">{pkg.data_limit}</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1"><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deletePackage(pkg.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
