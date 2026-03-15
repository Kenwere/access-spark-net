import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UsersRound, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  user_id: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  operator: "Operator",
  support: "Support",
};

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-destructive/15 text-destructive",
  admin: "bg-primary/15 text-primary",
  operator: "bg-warning/15 text-warning",
  support: "bg-muted text-muted-foreground",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("operator");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get org
    const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1).single();
    if (!org) { setLoading(false); return; }

    // Get profiles in this org
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, org_id").eq("org_id", org.id);
    if (!profiles) { setLoading(false); return; }

    // Get roles for these users
    const userIds = profiles.map(p => p.id);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);

    const team: TeamMember[] = profiles.map(p => {
      const userRole = roles?.find(r => r.user_id === p.id);
      return { id: p.id, full_name: p.full_name, email: p.email, role: userRole?.role || "operator", user_id: p.id };
    });

    setMembers(team);
    setLoading(false);
  };

  const handleAddMember = async () => {
    if (!email || !fullName) { toast.error("Fill all fields"); return; }

    // Create user via sign up (they'll need to set their password)
    const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      return;
    }

    if (signUpData.user) {
      // Set org_id on profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1).single();
        if (org) {
          await supabase.from("profiles").update({ org_id: org.id } as any).eq("id", signUpData.user.id);
        }
      }

      // Update role
      await supabase.from("user_roles").update({ role } as any).eq("user_id", signUpData.user.id);

      toast.success(`Team member added! They can login with: ${email}`);
      setDialogOpen(false);
      setEmail("");
      setFullName("");
      setRole("operator");
      fetchTeam();
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole } as any).eq("user_id", userId);
    if (error) toast.error("Failed to update role");
    else { toast.success("Role updated"); fetchTeam(); }
  };

  const removeMember = async (userId: string) => {
    const { error: roleErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error: profErr } = await supabase.from("profiles").delete().eq("id", userId);
    if (roleErr || profErr) toast.error("Failed to remove member");
    else { toast.success("Member removed"); fetchTeam(); }
  };

  return (
    <AdminLayout>
      <PageHeader title="Team" subtitle="Manage team members and roles">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-medium"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle className="font-display">Add Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Full Name</Label><Input placeholder="John Doe" className="mt-1.5" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" placeholder="john@example.com" className="mt-1.5" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-primary text-primary-foreground" onClick={handleAddMember}>Add Team Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : members.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UsersRound className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No team members yet</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{m.full_name || "—"}</td>
                    <td className="py-3 px-4 font-mono text-xs">{m.email}</td>
                    <td className="py-3 px-4">
                      {m.user_id === currentUserId ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadgeColors[m.role] || roleBadgeColors.support}`}>
                          <Shield className="w-3 h-3 inline mr-1" />{roleLabels[m.role] || m.role} (You)
                        </span>
                      ) : (
                        <Select value={m.role} onValueChange={v => updateRole(m.user_id, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="operator">Operator</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {m.user_id !== currentUserId && (
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 h-7 text-xs" onClick={() => removeMember(m.user_id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
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
