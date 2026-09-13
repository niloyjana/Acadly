"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { GlassCard, Badge } from "@/components/ui/glass-card";
import { format } from "date-fns";

type DashboardData = {
  totalTasks: number;
  pendingTasks: number;
  totalPoints: number;
  spaces: { id: string; name: string; role: string }[];
  upcomingEvents: { id: string; title: string; startTime: string; category: string; space: { name: string } }[];
  tasks: { id: string; title: string; deadline: string; status: string; points: number }[];
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) setGreeting("Good morning");
    else if (h >= 12 && h < 17) setGreeting("Good afternoon");
    else if (h >= 17 && h < 22) setGreeting("Good evening");
    else setGreeting("Up late");
    
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-semibold min-h-[36px]">
        {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : ""}
      </h1>

      {/* Bento Box Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4">
        
        {/* Large Left: Points */}
        <GlassCard className="col-span-2 md:row-span-2 flex flex-col justify-between relative overflow-hidden group min-h-[260px]">
          <div className="absolute inset-0 bg-gradient-to-br from-acadly-violet/10 to-transparent z-0 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/10 text-xs font-semibold tracking-wide text-ink/70 dark:text-white/70 mb-6 uppercase shadow-sm backdrop-blur-md">
                Total Points
              </div>
              <h3 className="text-6xl md:text-8xl font-bold tracking-tighter text-ink dark:text-white">
                {data?.totalPoints ?? "—"}
              </h3>
            </div>
            
            <p className="text-sm text-ink/60 dark:text-white/60 max-w-[220px]">
              Points earned by completing tasks on time across your workspaces.
            </p>
          </div>
        </GlassCard>

        {/* Top Right: Tasks Overview */}
        <GlassCard className="col-span-2 md:row-span-1 p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-black/5 dark:from-white/5 to-transparent z-0 pointer-events-none" />
          
          <div className="relative z-10 flex items-end justify-between h-full">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/50 dark:text-white/50">Total Tasks</span>
              <span className="text-4xl font-bold tracking-tighter text-ink dark:text-white">
                {data?.totalTasks ?? "—"}
              </span>
            </div>
            
            <div className="flex items-end gap-1.5 pb-1">
              {[3, 5, 4, 7, 6, 9, 8, 10, 7, 9].map((h, i) => (
                <div key={i} className="w-1.5 bg-acadly-violet/50 rounded-full" style={{ height: `${h * 4}px` }} />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Bottom Right 1: Pending */}
        <GlassCard className="col-span-1 md:row-span-1 p-6 flex flex-col justify-center items-center text-center">
          <span className="text-4xl font-bold tracking-tighter text-acadly-coral mb-2">
            {data?.pendingTasks ?? "—"}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/50 dark:text-white/50">
            Pending
          </span>
        </GlassCard>

        {/* Bottom Right 2: Completed */}
        <GlassCard className="col-span-1 md:row-span-1 p-6 flex flex-col justify-center items-center text-center">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-acadly-mint/10 mb-3 text-acadly-mint">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs font-semibold tracking-wider text-ink/60 dark:text-white/60">
            {data ? `${data.totalTasks - data.pendingTasks} COMPLETED` : "—"}
          </span>
        </GlassCard>

      </div>

      {data && data.spaces.length === 0 && (
        <GlassCard className="text-center py-10">
          <p className="font-medium mb-1">No spaces yet</p>
          <p className="text-sm text-ink/60 dark:text-white/60 mb-4">Join one with an invite code, or create your own committee.</p>
          <div className="flex justify-center gap-3">
            <Link href="/join" className="text-acadly-violet font-medium text-sm">Join a space</Link>
            <span className="text-ink/30">·</span>
            <Link href="/create-space" className="text-acadly-violet font-medium text-sm">Create a space</Link>
          </div>
        </GlassCard>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="font-medium mb-4">Upcoming activities</h2>
          <div className="space-y-3">
            {data?.upcomingEvents.length === 0 && <p className="text-sm text-ink/50 dark:text-white/50">Nothing on the calendar yet.</p>}
            {data?.upcomingEvents.map((e) => (
              <div key={e.id} className="glass-solid p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50">
                    {e.space.name} · {format(new Date(e.startTime), "d MMM, h:mm a")}
                  </p>
                </div>
                <Badge>{e.category}</Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="font-medium mb-4">Your tasks</h2>
          <div className="space-y-3">
            {data?.tasks.length === 0 && <p className="text-sm text-ink/50 dark:text-white/50">No tasks assigned right now.</p>}
            {data?.tasks.map((t) => (
              <div key={t.id} className="glass-solid p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50">Due {format(new Date(t.deadline), "d MMM")}</p>
                </div>
                <Badge tone={t.status === "MISSED" ? "coral" : t.status === "COMPLETED" ? "mint" : "amber"}>
                  {t.status.replace("_", " ").toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
