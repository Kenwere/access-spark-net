import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserX, Wifi, WifiOff, Clock, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  logout_time: string | null;
  router_id: string | null;
  duration_used: number | null;
}

export default function UsersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [extendDialog, setExtendDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(60);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*").order("login_time", { ascending: false });
    if (!error) setSessions((data as any[]) || []);
    setLoading(false);
  };

  const filtered = sessions.filter(u =>
    u.phone.includes(search) || (u.mac_address || "").includes(search) || u.package_name.toLowerCase().includes(search.toLowerCase())
  );

  const activeSessions = filtered.filter(s => s.status === "Active");
  const inactiveSessions = filtered.filter(s => s.status !== "Active");

  const disconnect = async (id: string) => {
    const { error } = await supabase.from("sessions").update({
      status: "Disconnected",
      logout_time: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) toast.error("Failed to disconnect");
    else { toast.success("User disconnected"); fetchSessions(); }
  };

  const extendExpiry = async () => {
    if (!selectedSession) return;
    // Extend by adding minutes to current logout_time or from now
    const baseTime = selectedSession.logout_time ? new Date(selectedSession.logout_time) : new Date();
    const newExpiry = new Date(baseTime.getTime() + extendMinutes * 60 * 1000);
    const { error } = await supabase.from("sessions").update({
      logout_time: newExpiry.toISOString(),
      status: "Active",
    } as any).eq("id", selectedSession.id);
    if (error) toast.error("Failed to extend session");
    else {
      toast.success(`Extended by ${extendMinutes} minutes`);
      setExtendDialog(false);
      fetchSessions();
    }
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) toast.error("Failed to delete session");
    else { toast.success("Session deleted"); fetchSessions(); }
  };

  const openExtend = (session: Session) => {
    setSelectedSession(session);
    setExtendMinutes(60);
    setExtendDialog(true);
  };

  return (
    <AdminLayout>
      <PageHeader title="Users & Sessions" subtitle="Manage connected users and active sessions">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Active:</span>
            <span className="font-display font-bold text-success">{activeSessions.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search phone, MAC, package..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </PageHeader>

      {/* Extend Dialog */}
      <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Extend Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Extend session for <span className="text-foreground font-mono">{selectedSession?.phone}</span>
            </p>
            <div>
              <Label>Additional time (minutes)</Label>
              <div className="flex gap-2 mt-2">
                {[30, 60, 120, 360, 1440].map(m => (
                  <Button
                    key={m}
                    size="sm"
                    variant={extendMinutes === m ? "default" : "outline"}
                    onClick={() => setExtendMinutes(m)}
                    className={extendMinutes === m ? "gradient-primary text-primary-foreground" : ""}
                  >
                    {m < 60 ? `${m}m` : m < 1440 ? `${m / 60}h` : "24h"}
                  </Button>
                ))}
              </div>
              <Input type="number" className="mt-2" value={extendMinutes} onChange={e => setExtendMinutes(Number(e.target.value))} />
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={extendExpiry}>
              <Clock className="w-4 h-4 mr-2" /> Extend by {extendMinutes} minutes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">IP</th>
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
                    <td className="py-3 px-4 font-mono text-xs hidden lg:table-cell">{u.device_ip || "—"}</td>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-border">
                          {u.status === "Active" && (
                            <DropdownMenuItem onClick={() => disconnect(u.id)} className="text-destructive">
                              <UserX className="w-3.5 h-3.5 mr-2" /> Disconnect
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openExtend(u)}>
                            <Clock className="w-3.5 h-3.5 mr-2" /> Extend Expiry
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteSession(u.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
