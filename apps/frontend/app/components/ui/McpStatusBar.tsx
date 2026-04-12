'use client';
import { Cpu, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';

export function McpStatusBar() {
  const { data, loading } = useHealth(20_000);

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3 border border-white/5 animate-pulse">
        <Cpu size={12} className="text-gray-600" />
        <span className="text-xs text-gray-600">Checking MCP...</span>
      </div>
    );
  }

  const { mcp, multiversx, network } = data;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/3 border border-white/8">
      {/* MCP status */}
      <div className="flex items-center gap-1.5">
        <Cpu size={12} className={mcp.connected ? 'text-emerald-400' : 'text-yellow-500'} />
        <span className="text-xs text-gray-400">
          SC MCP
          <span className={`ml-1 font-medium ${
            mcp.connected ? 'text-emerald-400' : 'text-yellow-500'
          }`}>
            {mcp.connected ? `${mcp.toolsLoaded} tools` : 'offline'}
          </span>
        </span>
      </div>

      <span className="text-white/10 text-xs">|</span>

      {/* MultiversX status */}
      <div className="flex items-center gap-1.5">
        {multiversx.reachable
          ? <CheckCircle2 size={12} className="text-emerald-400" />
          : <AlertCircle   size={12} className="text-red-400" />}
        <span className="text-xs text-gray-400">
          {network}
          {multiversx.nonce != null && (
            <span className="ml-1 text-gray-600 font-mono">#{multiversx.nonce}</span>
          )}
        </span>
      </div>

      <span className="text-white/10 text-xs">|</span>

      {/* Backend version */}
      <span className="text-xs text-gray-600">v{data.version}</span>
    </div>
  );
}
