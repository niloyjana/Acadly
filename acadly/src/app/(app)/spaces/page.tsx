"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard, Button, Badge } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";

type Membership = {
  id: string;
  role: string;
  status: string;
  space: { id: string; name: string; description: string | null; category: string | null };
};

export default function SpacesPage() {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [clickedSpace, setClickedSpace] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/spaces").then((r) => r.json()).then((d) => setMemberships(d.memberships));
  }, []);

  const active = memberships?.filter((m) => m.status === "ACTIVE") ?? [];
  const pending = memberships?.filter((m) => m.status === "PENDING") ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink dark:text-white">My Spaces</h1>
          <p className="text-ink/60 dark:text-white/60">Manage your active committees and groups.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/join"><Button variant="ghost">Join</Button></Link>
          <Link href="/create-space"><Button>Create</Button></Link>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink/60 dark:text-white/60 mb-2">Awaiting approval</p>
          <div className="grid md:grid-cols-2 gap-4">
            {pending.map((m) => (
              <GlassCard key={m.id} className="opacity-70 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-start gap-2">
                  <p className="font-medium">{m.space.name}</p>
                  <Badge tone="amber">Pending admin approval</Badge>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {active.map((m) => (
          <Link 
            key={m.id} 
            href={`/spaces/${m.space.id}`}
            onClick={() => setClickedSpace(m.space.id)}
          >
            <GlassCard className="relative overflow-hidden hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer h-full border border-black/5 dark:border-white/5">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="font-medium font-display text-lg">{m.space.name}</p>
                  <p className="text-sm text-ink/60 dark:text-white/60 mt-1">{m.space.description}</p>
                </div>
                <Badge>{m.role.replace("_", " ").toLowerCase()}</Badge>
              </div>

              {/* Ripple Animation */}
              <AnimatePresence>
                {clickedSpace === m.space.id && (
                  <motion.div
                    className="absolute inset-0 bg-black/5 dark:bg-white/10 pointer-events-none"
                    initial={{ clipPath: "circle(0% at 50% 50%)", opacity: 1 }}
                    animate={{ clipPath: "circle(150% at 50% 50%)", opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>
            </GlassCard>
          </Link>
        ))}
      </div>

      {memberships && active.length === 0 && pending.length === 0 && (
        <GlassCard className="text-center py-10">
          <p className="text-ink/60 dark:text-white/60">You're not part of any space yet.</p>
        </GlassCard>
      )}
    </div>
  );
}
