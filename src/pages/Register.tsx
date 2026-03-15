import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Mail, Lock, User, Building2, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ispName, setIspName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!ispName.trim()) { toast.error("ISP / Business name is required"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, isp_name: ispName } },
      });
      if (error) throw error;
      if (data.user) { toast.success("Registration successful! You can now login."); navigate("/login"); }
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Wifi className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">MoonConnect</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your ISP Admin Account</p>
        </div>

        <form onSubmit={handleRegister} className="glass-card p-6 space-y-4">
          <div>
            <Label htmlFor="ispName">ISP / Business Name</Label>
            <div className="relative mt-1.5">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="ispName" placeholder="e.g. StarLink WiFi" className="pl-10" value={ispName} onChange={(e) => setIspName(e.target.value)} required />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your subdomain: <span className="text-primary font-mono">{ispName ? ispName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : 'your-isp'}.moonconnect.app</span>
            </p>
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="fullName" placeholder="John Doe" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="admin@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="Minimum 6 characters" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="confirmPassword" type="password" placeholder="Re-enter password" className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-medium h-11" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : "Create ISP Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="text-primary hover:underline">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
}
