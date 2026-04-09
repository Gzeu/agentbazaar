'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MOCK_PROVIDERS, MOCK_SERVICES } from '@/lib/mock-data';

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const provider = MOCK_PROVIDERS?.find((p: any) => p.id === id || p.address === id)
    ?? {
      id,
      address: id,
      reputation: 0,
      totalTasks: 0,
      uptime: 0,
      category: 'Unknown',
      services: [],
      joinedAt: Date.now(),
      staked: '0',
      status: 'inactive',
    };

  const services = MOCK_SERVICES?.filter((s: any) =>
    provider.services?.includes(s.id)
  ) ?? [];

  const reputationColor =
    provider.reputation >= 95 ? 'text-emerald-400' :
    provider.reputation >= 85 ? 'text-brand-400' :
    provider.reputation >= 70 ? 'text-amber-400' : 'text-red-400';

  const shortAddr = provider.address
    ? `${provider.address.slice(0, 10)}...${provider.address.slice(-6)}`
    : id;

  return (
    <main className="min-h-screen page-wrapper">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/app/providers" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          ← Providers
        </Link>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-mono">{shortAddr}</h1>
                <p className="text-gray-400 text-sm mt-1">{provider.category ?? 'Agent Provider'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    provider.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {provider.status ?? 'active'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-mono ${reputationColor}`}>
                {provider.reputation?.toFixed(1) ?? '—'}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Reputație</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tasks', value: provider.totalTasks?.toLocaleString() ?? '0', icon: '⚡' },
            { label: 'Uptime', value: `${provider.uptime ?? 0}%`, icon: '🟢' },
            { label: 'Staked', value: `${provider.staked ?? '0'} EGLD`, icon: '🔒' },
            { label: 'Joined', value: provider.joinedAt ? new Date(provider.joinedAt).toLocaleDateString('ro') : '—', icon: '📅' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Services */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Servicii oferite</h2>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Niciun serviciu găsit pentru acest provider.</p>
              <p className="text-gray-600 text-xs mt-2 font-mono">{id}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service: any) => (
                <Link key={service.id} href={`/app/services/${service.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-brand-500/30 transition-all group">
                  <div>
                    <div className="font-medium text-white group-hover:text-brand-400 transition-colors">{service.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{service.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-brand-400">{service.price} EGLD</div>
                    <div className="text-xs text-gray-500">{service.reputation}% rep</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
