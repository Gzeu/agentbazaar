'use client';

import { useState } from 'react';
import { useWalletCtx } from '@/context/WalletContext';
import { useDispute, DISPUTE_EXPLORER } from '@/hooks/useDispute';
import {
  Scale, Wallet, AlertCircle, CheckCircle,
  ExternalLink, RefreshCw, Clock, ShieldCheck, XCircle
} from 'lucide-react';
import type { DisputeStatus, Dispute } from '@/hooks/useDispute';

const STATUS_STYLE: Record<DisputeStatus, string> = {
  open:               'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  arbitrating:        'bg-blue-400/10   text-blue-400   border-blue-400/30',
  resolved_consumer:  'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  resolved_provider:  'bg-purple-400/10 text-purple-400 border-purple-400/30',
  cancelled:          'bg-gray-700      text-gray-500   border-gray-600',
};

const STATUS_LABEL: Record<DisputeStatus, string> = {
  open:               'Open',
  arbitrating:        'Arbitrating',
  resolved_consumer:  'Won (Consumer)',
  resolved_provider:  'Won (Provider)',
  cancelled:          'Cancelled',
};

const STATUS_ICON: Record<DisputeStatus, React.ReactNode> = {
  open:               <Clock      size={13} className="text-yellow-400" />,
  arbitrating:        <Scale      size={13} className="text-blue-400" />,
  resolved_consumer:  <CheckCircle size={13} className="text-emerald-400" />,
  resolved_provider:  <ShieldCheck size={13} className="text-purple-400" />,
  cancelled:          <XCircle    size={13} className="text-gray-500" />,
};

function fmtEgld(raw: string) {
  try { return (Number(BigInt(raw)) / 1e18).toFixed(4) + ' EGLD'; }
  catch { return raw; }
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function DisputeCard({ d, myAddress }: { d: Dispute; myAddress: string }) {
  const isConsumer = d.consumerAddress === myAddress;
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {STATUS_ICON[d.status]}
          <span className="font-mono text-xs text-white">{d.taskId}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[d.status]}`}>
            {STATUS_LABEL[d.status]}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
            isConsumer
              ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
              : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
          }`}>
            {isConsumer ? 'as Consumer' : 'as Provider'}
          </span>
        </div>
        {d.txHash && (
          <a href={`${DISPUTE_EXPLORER}/transactions/${d.txHash}`} target="_blank" rel="noreferrer"
            className="text-gray-600 hover:text-brand-400 transition-colors shrink-0">
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Reason */}
      <p className="text-sm text-gray-300 bg-white/3 rounded-lg px-3 py-2">{d.reason}</p>

      {/* Escrow + parties */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-600">Escrow locked</span>
          <div className="text-white font-mono mt-0.5">{fmtEgld(d.escrowAmount)}</div>
        </div>
        <div>
          <span className="text-gray-600">Opened</span>
          <div className="text-white mt-0.5" suppressHydrationWarning>{timeAgo(d.createdAt)}</div>
        </div>
        <div>
          <span className="text-gray-600">Provider</span>
          <a href={`${DISPUTE_EXPLORER}/accounts/${d.providerAddress}`} target="_blank" rel="noreferrer"
            className="block font-mono text-brand-400 hover:underline mt-0.5 truncate">
            {d.providerAddress.slice(0,10)}…
          </a>
        </div>
        {d.resolvedAt && (
          <div>
            <span className="text-gray-600">Resolved</span>
            <div className="text-white mt-0.5" suppressHydrationWarning>{timeAgo(d.resolvedAt)}</div>
          </div>
        )}
      </div>

      {/* Arbitrator decision */}
      {d.arbitratorDecision && (
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
          <Scale size={12} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300">{d.arbitratorDecision}</p>
        </div>
      )}
    </div>
  );
}

export default function DisputePage() {
  const { connected, address, connect } = useWalletCtx();
  const { disputes, loading, submitting, error, txHash, openDispute, refresh } = useDispute();

  const [taskId, setTaskId] = useState('');
  const [reason, setReason] = useState('');
  const [done,   setDone]   = useState(false);

  const handleSubmit = async () => {
    if (!taskId.trim() || !reason.trim()) return;
    const hash = await openDispute(taskId.trim(), reason.trim());
    if (hash) {
      setDone(true);
      setTaskId('');
      setReason('');
      setTimeout(() => setDone(false), 6000);
    }
  };

  const activeCount   = disputes.filter(d => d.status === 'open' || d.status === 'arbitrating').length;
  const resolvedCount = disputes.filter(d => d.status.startsWith('resolved')).length;

  return (
    <main className="min-h-screen pb-12 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dispute Resolution</h1>
            <p className="text-gray-400 text-sm mt-1">
              Deschide o dispută pentru un task nerezolvat. Arbitrii on-chain decid câștigătorul.
            </p>
          </div>
          {connected && (
            <button onClick={refresh} disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Stats pills */}
        {connected && (
          <div className="flex gap-3">
            <div className="glass rounded-xl px-4 py-2.5 text-center">
              <div className="text-lg font-bold font-mono text-yellow-400">{activeCount}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Active</div>
            </div>
            <div className="glass rounded-xl px-4 py-2.5 text-center">
              <div className="text-lg font-bold font-mono text-emerald-400">{resolvedCount}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Resolved</div>
            </div>
            <div className="glass rounded-xl px-4 py-2.5 text-center">
              <div className="text-lg font-bold font-mono text-white">{disputes.length}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Total</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* TX success */}
        {txHash && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <span className="flex items-center gap-2"><CheckCircle size={14} /> Dispută deschisă on-chain</span>
            <a href={`${DISPUTE_EXPLORER}/transactions/${txHash}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs hover:underline">
              View TX <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Not connected */}
        {!connected ? (
          <div className="glass rounded-xl p-10 text-center">
            <Wallet size={28} className="mx-auto text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-3">Conectează wallet-ul</p>
            <p className="text-sm text-gray-500 mb-4">Ai nevoie de wallet conectat pentru a deschide o dispută.</p>
            <button onClick={connect}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors">
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Open dispute form */}
            <div className="glass rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Scale size={14} className="text-orange-400" /> Deschide Dispută Nouă
              </h2>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Task ID *</label>
                <input
                  value={taskId}
                  onChange={e => setTaskId(e.target.value)}
                  placeholder="task-abc12345"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Motiv dispută *</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  placeholder="Descrie problema: task-ul nu a fost completat, output incorect, provider neresponsiv..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>

              {/* Process info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300">
                <p className="font-semibold mb-2 flex items-center gap-1.5"><Scale size={11} /> Procesul de dispută</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                  <li>TX semnat on-chain — escrow blocat automat</li>
                  <li>Provider-ul are 24h să răspundă</li>
                  <li>Arbitrii on-chain votează câștigătorul</li>
                  <li>Escrow eliberat conform deciziei</li>
                </ol>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !taskId.trim() || !reason.trim()}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Trimit TX…</>
                  : done
                    ? <><CheckCircle size={14} /> Dispută trimisă!</>
                    : <><Scale size={14} /> Deschide Dispută On-Chain</>
                }
              </button>
            </div>

            {/* Active disputes list */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Disputele mele</h2>
              {loading && disputes.length === 0 ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="glass rounded-xl h-32 animate-pulse" />)}
                </div>
              ) : disputes.length === 0 ? (
                <div className="glass rounded-xl py-12 text-center">
                  <Scale size={24} className="mx-auto text-gray-700 mb-2" />
                  <p className="text-gray-600 text-sm">Nicio dispută deschisă momentan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map(d => (
                    <DisputeCard key={d.id} d={d} myAddress={address!} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
