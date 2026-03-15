import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Voucher { id: string; code: string; package_name: string; expiry_date: string | null; status: string; created_at: string; }
interface Pkg { id: string; name: string; duration_label: string; }

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState("1");
  const [selectedPkg, setSelectedPkg] = useState("");
  const [expiry, setExpiry] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
      supabase.from("packages").select("id, name, duration_label").eq("active", true),
    ]).then(([vRes, pRes]) => { setVouchers((vRes.data as any[]) || []); setPackages((pRes.data as any[]) || []); setLoading(false); });
  }, []);

  const generateCode = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = ""; for (let i = 0; i < 8; i++) code += c[Math.floor(Math.random() * c.length)]; return code; };

  const handleGenerate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedPkg) return;
    const pkg = packages.find(p => p.id === selectedPkg);
    if (!pkg) return;
    const num = Math.min(Number(count) || 1, 100);
    const { data: orgs } = await supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1);
    const rows = Array.from({ length: num }, () => ({
      user_id: user.id, org_id: orgs?.[0]?.id || null, code: generateCode(),
      package_id: pkg.id, package_name: `${pkg.name} - ${pkg.duration_label}`, expiry_date: expiry || null,
    }));
    const { error } = await supabase.from("vouchers").insert(rows as any);
    if (error) toast.error("Failed to generate vouchers");
    else { toast.success(`${num} voucher(s) generated!`); setDialogOpen(false); const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false }); setVouchers((data as any[]) || []); }
  };

  return (
    <AdminLayout>
      <PageHeader title="Vouchers" subtitle="Generate and manage WiFi access vouchers">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground font-medium"><Plus className="w-4 h-4 mr-2" /> Generate Vouchers</Button></DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle className="font-display">Generate Vouchers</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Number of Vouchers</Label><Input type="number" placeholder="10" className="mt-1.5" value={count} onChange={e => setCount(e.target.value)} /></div>
              <div><Label>Package</Label><Select value={selectedPkg} onValueChange={setSelectedPkg}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select package" /></SelectTrigger><SelectContent>{packages.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - {p.duration_label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Expiry Date</Label><Input type="date" className="mt-1.5" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
              <Button className="w-full bg-primary text-primary-foreground" onClick={handleGenerate}>Generate</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : vouchers.length === 0 ? (
        <div className="glass-card p-12 text-center"><Ticket className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground">No vouchers yet</p></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Code</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Package</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Expiry</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4"><span className="inline-flex items-center gap-2 font-mono text-xs bg-muted px-2 py-1 rounded"><Ticket className="w-3 h-3 text-primary" /> {v.code}</span></td>
                    <td className="py-3 px-4">{v.package_name}</td>
                    <td className="py-3 px-4 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-xs">{v.expiry_date || "—"}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === "Unused" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{v.status}</span></td>
                    <td className="py-3 px-4"><Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(v.code); toast.success("Copied!"); }}><Copy className="w-3 h-3 mr-1" /> Copy</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
