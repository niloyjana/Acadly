"use client";

import { useState } from "react";
import { GlassCard, Button } from "@/components/ui/glass-card";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/spaces/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage({ text: data.message ?? data.error, ok: res.ok });
    if (res.ok) setCode("");
  }

  return (
    <div className="max-w-md mx-auto">
      <GlassCard className="p-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Join a Space</h1>
        <p className="text-sm text-ink/60 dark:text-white/60 mb-6">Enter the invite code shared by your committee's admin.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ACD-7FQ9-K2M8"
            className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm tracking-widest text-center font-medium"
          />
          {message && (
            <p className={`text-sm ${message.ok ? "text-acadly-mint" : "text-acadly-coral"}`}>{message.text}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Requesting…" : "Request Access"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
