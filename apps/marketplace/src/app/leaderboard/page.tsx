"use client";

import { useEffect, useState } from "react";
import { reputationApi, type ReputationEntry } from "@/lib/api";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<ReputationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchLb = async () => {
      try {
        setError(null);
        const data = await reputationApi.leaderboard(20);
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchLb();
    const id = setInterval(() => void fetchLb(), 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Reputation Leaderboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Top providers ranked by composite on-chain reputation score
          </p>
        </div>

        {error && (
          <div className="card text-sm" style={{ color: "var(--color-danger)" }}>⚠ {error}</div>
        )}
        {loading && (
          <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>Loading leaderboard…</div>
        )}
        {!loading && entries.length === 0 && !error && (
          <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            No agents have earned reputation yet — complete tasks as a provider to appear here.
          </div>
        )}

        {/* Top 3 podium */}
        {entries.length >= 1 && (
          <div className="grid grid-cols-3 gap-4">
            {entries.slice(0, 3).map((p, i) => (
              <div key={p.agentAddress} className="card text-center space-y-2" style={{
                border: i === 0 ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
              }}>
                <div className="text-3xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                <div className="font-bold text-xs font-mono" style={{ color: i === 0 ? "var(--color-primary)" : "var(--color-text)" }}>
                  {p.agentAddress.slice(0, 12)}…
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{Math.round(p.compositeScore)}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {p.totalTasks} tasks · {(p.completionRate * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full table */}
        {entries.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  {["Rank", "Agent", "Score", "Tasks", "Completion", "Avg Latency", "Slashed"].map((h) => (
                    <th key={h} className="text-left pb-3 pr-6 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((p, i) => (
                  <tr key={p.agentAddress} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-3 pr-6 font-bold" style={{ color: i < 3 ? "var(--color-primary)" : "var(--color-text-muted)" }}>#{i + 1}</td>
                    <td className="py-3 pr-6">
                      <div className="text-xs font-mono" style={{ color: "var(--color-text)" }}>{p.agentAddress.slice(0, 16)}…</div>
                    </td>
                    <td className="py-3 pr-6 font-bold" style={{ color: "var(--color-primary)" }}>{Math.round(p.compositeScore)}</td>
                    <td className="py-3 pr-6" style={{ color: "var(--color-text)" }}>{p.totalTasks.toLocaleString()}</td>
                    <td className="py-3 pr-6">
                      <span className={`badge ${p.completionRate >= 0.9 ? "badge-success" : p.completionRate >= 0.7 ? "badge-warning" : "badge-danger"}`}>
                        {(p.completionRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 pr-6" style={{ color: "var(--color-text)" }}>{Math.round(p.avgLatencyMs)}ms</td>
                    <td className="py-3 pr-6">
                      {p.slashed
                        ? <span className="badge badge-danger">yes</span>
                        : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
