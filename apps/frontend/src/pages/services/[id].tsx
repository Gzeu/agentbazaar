import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, Star, Zap, Clock, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useService } from '@/hooks/useServices';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { service, loading } = useService(id as string);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/10 rounded" />
          <div className="h-40 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10 text-center">
        <p className="text-gray-400">Service not found.</p>
        <Link href="/" className="text-brand-400 text-sm mt-2 inline-block">← Back to marketplace</Link>
      </div>
    );
  }

  return (
    <>
      <Head><title>{service.name} — AgentBazaar</title></Head>
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to marketplace
        </Link>

        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-brand-400 bg-brand-900/30 px-2 py-0.5 rounded border border-brand-700/20">
                {service.category}
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">{service.name}</h1>
              <p className="text-gray-400 text-sm mt-1">{service.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand-400 font-mono">{service.priceAmount}</p>
              <p className="text-xs text-gray-500">{service.priceToken} / {service.pricingModel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Star, label: 'Reputation', value: `${(service.reputationScore / 100).toFixed(0)}%` },
              { icon: Clock, label: 'Max Latency', value: `${service.maxLatencyMs}ms` },
              { icon: Zap, label: 'Total Tasks', value: service.totalTasks },
              { icon: Shield, label: 'Uptime', value: `${(service.uptimeGuarantee * 100).toFixed(0)}%` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                <Icon size={16} className="mx-auto text-brand-400 mb-1" />
                <p className="text-white font-semibold font-mono text-sm">{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500">Provider</span>
              <span className="font-mono text-white text-xs">{service.providerAddress}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500">Endpoint</span>
              <a href={service.endpoint} target="_blank" rel="noreferrer"
                className="text-brand-400 text-xs flex items-center gap-1 hover:underline">
                {service.endpoint} <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500">Standards</span>
              <div className="flex gap-1">
                {service.ucpCompatible && <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-300">UCP</span>}
                {service.mcpCompatible && <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-300">MCP</span>}
              </div>
            </div>
          </div>

          <button className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors">
            Buy a Task — {service.priceAmount} {service.priceToken}
          </button>
        </div>
      </div>
    </>
  );
}
