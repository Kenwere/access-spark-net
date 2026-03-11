import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { DollarSign, Users, Wifi, Clock, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, activeUsers: 0, activeSessions: 0, totalPayments: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [paymentsRes, sessionsRes, recentRes] = await Promise.all([
        supabase.from("payments").select("amount, created_at, status"),
        supabase.from("sessions").select("id, status"),
        supabase.from("sessions").select("phone, package_name, status, login_time, mac_address").order("login_time", { ascending: false }).limit(10),
      ]);

      const payments = (paymentsRes.data as any[]) || [];
      const sessions = (sessionsRes.data as any[]) || [];

      const todayRevenue = payments
        .filter(p => p.created_at?.startsWith(today) && p.status === "Completed")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const activeSessions = sessions.filter(s => s.status === "Active").length;

      // Last 7 days revenue
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().split("T")[0];
        const dayRevenue = payments
          .filter(p => p.created_at?.startsWith(key) && p.status === "Completed")
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        return { name: d.toLocaleDateString("en", { weekday: "short" }), revenue: dayRevenue };
      });

      setStats({ revenue: todayRevenue, activeUsers: activeSessions, activeSessions, totalPayments: payments.length });
      setRevenueData(last7);
      setRecentSessions((recentRes.data as any[]) || []);
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" subtitle="Overview of your hotspot network" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} title="Today's Revenue" value={`KSH ${stats.revenue.toLocaleString()}`} change={stats.revenue > 0 ? "From payments" : "No revenue yet"} changeType={stats.revenue > 0 ? "up" : "neutral"} />
        <StatCard icon={Users} title="Active Users" value={String(stats.activeUsers)} change={stats.activeUsers > 0 ? "Currently connected" : "No users yet"} changeType={stats.activeUsers > 0 ? "up" : "neutral"} />
        <StatCard icon={Wifi} title="Active Sessions" value={String(stats.activeSessions)} change={stats.activeSessions > 0 ? "Live now" : "No sessions yet"} changeType={stats.activeSessions > 0 ? "up" : "neutral"} />
        <StatCard icon={Clock} title="Total Payments" value={String(stats.totalPayments)} change={stats.totalPayments > 0 ? "All time" : "No data"} changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm">Weekly Revenue</h3>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(175, 80%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(175, 80%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(220, 22%, 9%)', border: '1px solid hsl(220, 20%, 16%)', borderRadius: 8, color: 'hsl(220, 10%, 90%)' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(175, 80%, 45%)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          {revenueData.every(d => d.revenue === 0) && (
            <p className="text-center text-sm text-muted-foreground mt-4">No revenue data available yet</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm">Recent Sessions</h3>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-center py-12">
              <Wifi className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {recentSessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                  <div>
                    <span className="font-mono text-xs">{s.phone}</span>
                    <span className="text-muted-foreground ml-2 text-xs">— {s.package_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
