import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Trophy, Clock, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const medalColors = ["text-warning", "text-muted-foreground", "text-warning/60"];

interface RankEntry { phone: string; hours: number; sessions: number; }

export default function Rankings() {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("sessions").select("phone, duration_used");
      if (data) {
        const map = new Map<string, { hours: number; sessions: number }>();
        (data as any[]).forEach(s => {
          const existing = map.get(s.phone) || { hours: 0, sessions: 0 };
          existing.hours += (s.duration_used || 0) / 60;
          existing.sessions += 1;
          map.set(s.phone, existing);
        });
        const sorted = Array.from(map.entries())
          .map(([phone, v]) => ({ phone, hours: Math.round(v.hours * 10) / 10, sessions: v.sessions }))
          .sort((a, b) => b.hours - a.hours);
        setRankings(sorted);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AdminLayout>
      <PageHeader title="User Rankings" subtitle="Top internet users by usage" />

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : rankings.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No rankings yet</p>
          <p className="text-xs text-muted-foreground mt-1">User rankings will appear here once there is usage data</p>
        </div>
      ) : (
        <>
          {rankings.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {rankings.slice(0, 3).map((u, i) => (
                <div key={i} className={`glass-card-glow rounded-xl p-6 text-center ${i === 0 ? "sm:order-2 ring-1 ring-primary/30" : i === 1 ? "sm:order-1" : "sm:order-3"}`}>
                  <Trophy className={`w-8 h-8 mx-auto mb-2 ${medalColors[i]}`} />
                  <p className="text-2xl font-display font-bold">#{i + 1}</p>
                  <p className="font-mono text-sm mt-1">{u.phone}</p>
                  <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {u.hours}h</span>
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> {u.sessions}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Phone</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Hours Used</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((u, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-display font-bold">#{i + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs">{u.phone}</td>
                      <td className="py-3 px-4">{u.hours} hrs</td>
                      <td className="py-3 px-4">{u.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
