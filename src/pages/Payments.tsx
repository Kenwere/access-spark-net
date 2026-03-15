import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Search, Download, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string; phone: string; package_name: string; amount: number; method: string;
  router_name: string | null; session_expiry: string | null; status: string;
  transaction_id: string | null; created_at: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("payments").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setPayments((data as any[]) || []); setLoading(false); });
  }, []);

  const filtered = payments.filter(p => p.phone.includes(search) || p.package_name.toLowerCase().includes(search.toLowerCase()));

  const exportCSV = () => {
    const csv = ["Phone,Package,Amount,Method,Status,Date", ...filtered.map(p => `${p.phone},${p.package_name},${p.amount},${p.method},${p.status},${p.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <PageHeader title="Payment Logs" subtitle="Track all payment transactions">
        <div className="flex gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search by phone..." className="pl-9 w-56" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center"><Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground">No payments yet</p></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Package</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Method</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Transaction ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr></thead>
              <tbody>{filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{p.phone}</td>
                  <td className="py-3 px-4">{p.package_name}</td>
                  <td className="py-3 px-4 font-medium">KSH {p.amount}</td>
                  <td className="py-3 px-4 hidden md:table-cell">{p.method}</td>
                  <td className="py-3 px-4 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-xs hidden lg:table-cell">{p.transaction_id || "—"}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === "Completed" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{p.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
