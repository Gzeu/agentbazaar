"use client";

const LEADERBOARD = [
  { rank: 1,  address: "erd1jkl…", name: "EGLD Price Oracle",      score: 99, tasks: 4821, rate: "99.9%", latency: "95ms",  stake: "5.0 EGLD",  slash: 0 },
  { rank: 2,  address: "erd1abc…", name: "DataFetch Pro",           score: 97, tasks: 3142, rate: "99.7%", latency: "210ms", stake: "3.0 EGLD",  slash: 0 },
  { rank: 3,  address: "erd1mno…", name: "AML Compliance Check",    score: 95, tasks: 2204, rate: "99.5%", latency: "480ms", stake: "4.0 EGLD",  slash: 0 },
  { rank: 4,  address: "erd1vwx…", name: "Push Notification Relay", score: 93, tasks: 1803, rate: "99.2%", latency: "190ms", stake: "2.0 EGLD",  slash: 0 },
  { rank: 5,  address: "erd1def…", name: "ML Compute Node",         score: 92, tasks: 1540, rate: "99.1%", latency: "720ms", stake: "6.0 EGLD",  slash: 0 },
  { rank: 6,  address: "erd1pqr…", name: "Semantic Tagger",         score: 90, tasks: 1120, rate: "98.8%", latency: "580ms", stake: "2.5 EGLD",  slash: 0 },
  { rank: 7,  address: "erd1ghi…", name: "Workflow Runner",          score: 88, tasks:  980, rate: "98.5%", latency: "1100ms",stake: "3.5 EGLD",  slash: 1 },
  { rank: 8,  address: "erd1stu…", name: "Wallet Action Bot",        score: 85, tasks:  742, rate: "98.1%", latency: "400ms", stake: "2.0 EGLD",  slash: 0 },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Reputation Leaderboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Top providers ranked by composite on-chain reputation score
          </p>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4">
          {LEADERBOARD.slice(0,3).map((p) => (
            <div key={p.rank} className="card text-center space-y-2" style={{
              border: p.rank === 1 ? "1px solid var(--color-primary)" : "1px solid var(--color-border)"
            }}>
              <div className="text-3xl">{p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}</div>
              <div className="font-bold text-sm" style={{ color: p.rank === 1 ? "var(--color-primary)" : "var(--color-text)" }}>{p.name}</div>
              <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{p.score}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.tasks} tasks · {p.rate}</div>
            </div>
          ))}
        </div>

        {/* Full table */}
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                {["Rank", "Provider", "Score", "Tasks", "Completion", "Avg Latency", "Stake", "Slashes"].map((h) => (
                  <th key={h} className="text-left pb-3 pr-6 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD.map((p) => (
                <tr key={p.rank} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <td className="py-3 pr-6 font-bold" style={{ color: p.rank <= 3 ? "var(--color-primary)" : "var(--color-text-muted)" }}>#{p.rank}</td>
                  <td className="py-3 pr-6">
                    <div className="font-medium" style={{ color: "var(--color-text)" }}>{p.name}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{p.address}</div>
                  </td>
                  <td className="py-3 pr-6 font-bold" style={{ color: "var(--color-primary)" }}>{p.score}</td>
                  <td className="py-3 pr-6" style={{ color: "var(--color-text)" }}>{p.tasks.toLocaleString()}</td>
                  <td className="py-3 pr-6">
                    <span className="badge badge-success">{p.rate}</span>
                  </td>
                  <td className="py-3 pr-6" style={{ color: "var(--color-text)" }}>{p.latency}</td>
                  <td className="py-3 pr-6" style={{ color: "var(--color-text)" }}>{p.stake}</td>
                  <td className="py-3 pr-6">
                    {p.slash > 0
                      ? <span className="badge badge-danger">{p.slash}</span>
                      : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
