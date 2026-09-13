"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, Button } from "@/components/ui/glass-card";

export default function CreateSpacePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", category: "", approvalRequired: true });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not create the space.");
    router.push(`/spaces/${data.space.id}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <GlassCard className="p-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Create a Space</h1>
        <p className="text-sm text-ink/60 dark:text-white/60 mb-6">
          A Space is your committee's own calendar, tasks, files, and member list.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Farewell 2026"
              className="focus-ring mt-1 w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="College Event"
              className="focus-ring mt-1 w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Fourth-year farewell organizing committee"
              rows={3}
              className="focus-ring mt-1 w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.approvalRequired}
              onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })} />
            Require admin approval before someone joins
          </label>
          {error && <p className="text-sm text-acadly-coral">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create Space"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
