"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard, Button, Badge } from "@/components/ui/glass-card";

type Membership = {
  id: string;
  role: string;
  status: string;
  space: { id: string; name: string; description: string | null; category: string | null };
};

export default function SpacesPage() {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);

  useEffect(() => {
    fetch("/api/spaces").then((r) => r.json()).then((d) => setMemberships(d.memberships));
  }, []);

  const active = memberships?.filter((m) => m.status === "ACTIVE") ?? [];
  const pending = memberships?.filter((m) => m.status === "PENDING") ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">My Spaces</h1>
        <div className="flex gap-2">
          <Link href="/join"><Button variant="ghost">Join with code</Button></Link>
          <Link href="/create-space"><Button>New Space</Button></Link>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink/60 dark:text-white/60 mb-2">Awaiting approval</p>
          <div className="grid md:grid-cols-2 gap-4">
            {pending.map((m) => (
              <GlassCard key={m.id} className="opacity-70">
                <p className="font-medium">{m.space.name}</p>
                <Badge tone="amber">Pending admin approval</Badge>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {active.map((m) => (
          <Link key={m.id} href={`/spaces/${m.space.id}`}>
            <GlassCard className="hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium font-display text-lg">{m.space.name}</p>
                  <p className="text-sm text-ink/60 dark:text-white/60 mt-1">{m.space.description}</p>
                </div>
                <Badge>{m.role.replace("_", " ").toLowerCase()}</Badge>
              </div>
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
