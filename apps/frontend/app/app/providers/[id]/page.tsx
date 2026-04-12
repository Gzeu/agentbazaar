'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProviders } from '@/hooks/useProviders';
import { useServices } from '@/hooks/useServices';

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { providers, loading: provLoading, error: provError } = useProviders();
  const { services, loading: svcLoading } = useServices();

  const loading = provLoading || svcLoading;
  const provider = providers.find(p => p.id === id || p.address === id);
  const providerServices = provider
    ? services.filter(s => provider.services.includes(s.id))
    : [];

  const reputationColor =
    !provider ? 'text-dark-muted' :
    provider.reputation >= 95 ? 'text-emerald-400' :
    provider.reputation >= 85 ? 'text-brand-400' :
    provider.reputation >= 70 ? 'text-amber-400' : 'text-red-400';

  const shortAddr = (addr: string) =>
    addr ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : id;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-dark-muted">Se incarca provider-ul...</p>
      </div>
    );
  }

  if (provError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-lg font-bold text-dark-text">Eroare la incarcare</h2>
        <p className="text-sm text-dark-muted">{provError}</p>
        <button className="btn-secondary" onClick={() => router.push('/app/providers')}>← Providers</button>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">🤖</span>
        <h2 className="text-lg font-bold text-dark-text">Provider negasit</h2>
        <p className="text-xs font-mono text-dark-muted">{id}</p>
        <button className="btn-secondary" onClick={() => router.push('/app/providers')}>← Providers</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen page-wrapper">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/app/providers" className="inline-flex items-center gap-2 text-sm text-dark-muted hover:text-dark-text mb-6 transition-colors">
          ← Providers
        </Link>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-2xl">🤖</div>
              <div>
                <h1 className="text-xl font-bold text-dark-text font-mono">{shortAddr(provider.address)}</h1>
                <p className="text-dark-muted text-sm mt-1">{provider.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    provider.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-surface2 text-dark-muted'
                  }`}>{provider.status}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-mono ${reputationColor}`}>{provider.reputation.toFixed(1)}%</div>
              <div className="text-xs text-dark-muted mt-1">Reputatie</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tasks', value: provider.totalTasks.toLocaleString() },
            { label: 'Uptime',      value: `${provider.uptime}%` },
            { label: 'Staked',      value: `${provider.staked} EGLD` },
            { label: 'Joined',      value: new Date(provider.joinedAt).toLocaleDateString('ro-RO') },
          ].map(stat => (
            <div key={stat.label} className="bg-dark-surface2 rounded-xl p-4">
              <p className="text-xs text-dark-muted uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-base font-bold font-mono text-dark-text">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="section-heading mb-4">Servicii oferite</h2>
          {providerServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-dark-muted text-sm">Niciun serviciu activ pentru acest provider.</p>
              <p className="text-dark-muted/50 text-xs mt-2 font-mono">{provider.address}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providerServices.map(service => (
                <Link key={service.id} href={`/app/services/${service.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-surface2 border border-dark-border hover:border-brand-500/30 transition-all group">
                  <div>
                    <p className="font-medium text-dark-text group-hover:text-brand-400 transition-colors">{service.name}</p>
                    <p className="text-xs text-dark-muted mt-0.5">{service.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-brand-400">{service.priceAmount} EGLD</p>
                    <p className="text-xs text-dark-muted">{(service.reputationScore / 100).toFixed(1)}% rep</p>
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
