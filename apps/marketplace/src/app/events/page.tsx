"use client";
import { useEvents, EVENT_COLORS, EVENT_ICONS, ChainEvent } from "@/hooks/useEvents";
import { useState } from "react";

const EVENT_TYPES = ["All", "TaskCreated", "TaskCompleted", "ServiceRegistered", "ReputationUpdated", "EscrowReleased"];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  return `${Math.floor(diff / 60000)}m ago`;
}

export default function EventsPage() {
  const events = useEvents(80);
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? events : events.filter((e) => e.type === filter);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Live Event Feed</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Real-time blockchain events from MultiversX Supernova · 500ms polling
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
            Live · {events.length} events
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={{
                borderColor: filter === t ? (t === "All" ? "var(--color-primary)" : EVENT_COLORS[t as keyof typeof EVENT_COLORS] ?? "var(--color-primary)") : "var(--color-border)",
                color: filter === t ? (t === "All" ? "var(--color-primary)" : EVENT_COLORS[t as keyof typeof EVENT_COLORS] ?? "var(--color-primary)") : "var(--color-text-muted)",
                background: filter === t ? "rgba(255,255,255,0.04)" : "transparent",
              }}
            >
              {t !== "All" && EVENT_ICONS[t as keyof typeof EVENT_ICONS]} {t}
            </button>
          ))}
        </div>

        {/* Event stream */}
        <div className="space-y-2">
          {filtered.map((event: ChainEvent) => (
            <div
              key={event.id}
              className="card flex flex-col sm:flex-row sm:items-center gap-3 border-l-2"
              style={{ borderLeftColor: EVENT_COLORS[event.type] ?? "var(--color-border)" }}
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg">{EVENT_ICONS[event.type]}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: "var(--color-surface-2)", color: EVENT_COLORS[event.type] }}
                >
                  {event.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                  tx: {event.txHash}
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {Object.entries(event.data).map(([k, v]) => (
                    <span key={k} className="text-xs">
                      <span style={{ color: "var(--color-text-muted)" }}>{k}: </span>
                      <span style={{ color: "var(--color-text)" }}>{v}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                {timeAgo(event.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
