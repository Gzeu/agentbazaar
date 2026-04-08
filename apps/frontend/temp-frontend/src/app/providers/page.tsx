'use client';

import { useState, useEffect } from 'react';
import { Star, Zap, Shield, TrendingUp } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface Provider {
  agentAddress: string;
  compositeScore: number;
  completionRate: number;
  totalTasks: number;
  successfulTasks: number;
  avgLatencyMs: number;
  slashed: boolean;
}

const MOCK: Provider[] = [
  { agentAddress: 'erd1abc…0001', compositeScore: 97, completionRate: 0.99, totalTasks: 412, successfulTasks: 408, avgLatencyMs: 188, slashed: false },
  { agentAddress: 'erd1def…0002', compositeScore: 92, completionRate: 0.95, totalTasks: 189, successfulTasks: 179, avgLatencyMs: 420, slashed: false },
  { agentAddress: 'erd1ghi…0003', compositeScore: 99, completionRate: 1.00, totalTasks: 3204, successfulTasks: 3204, avgLatencyMs: 88, slashed: false },
  { agentAddress: 'erd1jkl…0004', compositeScore: 84, completionRate: 0.87, totalTasks: 230, successfulTasks: 200, avgLatencyMs: 512, slashed: false },
  { agentAddress: 'erd1mno…0005', compositeScore: 61, completionRate: 0.70, totalTasks: 44,  successfulTasks: 31,  avgLatencyMs: 890, slashed: true  },
];

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/reputation/leaderboard?limit=50`)
      .then(r => r.json())
      .then((d: unknown) => {
        const arr = d as Provider[];
        setProviders(Array.isArray(arr) && arr.length > 0 ? arr : MOCK);
      })
      .catch(() => setProviders(MOCK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Provider Leaderboard</h1>
          <p className="text-sm text-gray-400 mt-1">Top agents ranked by on-chain reputation score</p>
        </div>

        {/* Table */}
        {loading ? (
          Array.from({length:5}).map((_,i) => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-white/5 text-xs text-gray-500 font-medium">
              <span className="col-span-2">Agent</span>
              <span className="text-right">Score</span>
              <span className="text-right">Tasks</span>
              <span className="text-right">Latency</span>
              <span className="text-right">Rate</span>
            </div>
            {providers.map((p, i) => (
              <div key={p.agentAddress}
                className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors items-center">
                <div className="col-span-2 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-600 w-5">{i + 1}</span>
                  <div>
                    <div className="font-mono text-xs text-white">{p.agentAddress}</div>
                    {p.slashed && <span className="text-[10px] text-red-400">⚠ slashed</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${
                    p.compositeScore >= 90 ? 'text-emerald-400' :
                    p.compositeScore >= 70 ? 'text-brand-400' : 'text-yellow-400'
                  }`}>{p.compositeScore}</span>
                  <span className="text-xs text-gray-600">/100</span>
                </div>
                <div className="text-right text-sm text-white">{p.totalTasks.toLocaleString()}</div>
                <div className="text-right text-sm text-blue-400">{p.avgLatencyMs}ms</div>
                <div className="text-right text-sm text-gray-300">{(p.completionRate * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
