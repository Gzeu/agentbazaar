'use client';

import { useHealth } from '@/hooks/useHealth';

export function McpStatusBar() {
  const { health, loading } = useHealth(20_000);

  // Don't render anything while loading first fetch or when backend is healthy (no banner needed)
  if (loading || health?.status === 'ok') return null;

  return (
    <div className="mcp-bar-enter fixed top-14 left-0 right-0 z-40 bg-red-900/80 backdrop-blur border-b border-red-700/40 px-4 py-1.5 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs text-red-200 font-mono">
        MCP Backend unreachable — funcționalitățile live sunt dezactivate
      </span>
    </div>
  );
}
