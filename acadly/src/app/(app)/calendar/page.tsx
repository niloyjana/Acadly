"use client";

import { useEffect, useState } from "react";
import InteractiveCalendar from "@/components/ui/visualize-booking";

export default function GlobalCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-ink/50 dark:text-white/50">Loading calendar...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-ink dark:text-white tracking-tight">
          My Calendar
        </h1>
        <p className="text-ink/60 dark:text-white/60">
          All your upcoming events across all your spaces.
        </p>
      </div>

      <InteractiveCalendar events={events} />
    </div>
  );
}
