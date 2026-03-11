import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserX, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Session {
  id: string;
  phone: string;
  mac_address: string | null;
  device_ip: string | null;
  package_name: string;
  status: string;
  login_time: string;
  router_id: string | null;
}

export default function UsersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*").order("login_time", { ascending: false });
    if (!error) setSessions((data as any[]) || []);
    setLoading(false);
  };

  const filtered = sessions.filter(u => u.phone.includes(search) || (u.mac_address || "").includes(search));

  const disconnect = async (id: string) => {
    await supabase.from("sessions").update({ status: "Disconnected", logout_time: new Date().toISOString() } as any).eq("id", id);
    toast.success("User disconnected");
    fetchSessions();
  };

  return (
    <AdminLayout>
      <PageHeader title="Users & Sessions" subtitle="Manage connected users and active sessions">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by phone or MAC..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Wifi className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No sessions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Connected users will appear here</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Phone</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">MAC</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Package</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Connected</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{u.phone}</td>
                    <td className="py-3 px-4 font-mono text-xs hidden md:table-cell">{u.mac_address || "—"}</td>
                    <td className="py-3 px-4">{u.package_name}</td>
                    <td className="py-3 px-4 text-xs">{new Date(u.login_time).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        u.status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {u.status === "Active" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.status === "Active" && (
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 h-7 text-xs" onClick={() => disconnect(u.id)}>
                          <UserX className="w-3 h-3 mr-1" /> Disconnect
                        </Button>
                      )}
                    </td>
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
