/**
 * /w/[hash] — Warp Viewer Page
 * Resolves a Warp hash/alias and renders it inline.
 * Useful for sharing on Twitter/Discord without requiring navigation.
 */
import { Metadata } from 'next';

interface WarpViewerPageProps {
  params: { hash: string };
}

async function getWarp(hash: string) {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/warps/resolve/${hash}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: WarpViewerPageProps,
): Promise<Metadata> {
  const data = await getWarp(params.hash);
  const warp = data?.warp;
  return {
    title: warp?.title ?? 'AgentBazaar Warp',
    description: warp?.description ?? 'Execute this transaction on AgentBazaar.',
    openGraph: {
      title: warp?.title ?? 'AgentBazaar Warp',
      description: warp?.description ?? 'Execute this transaction on AgentBazaar.',
      images: warp?.preview ? [warp.preview] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: warp?.title ?? 'AgentBazaar Warp',
      description: warp?.description ?? 'Execute this transaction on AgentBazaar.',
    },
  };
}

export default async function WarpViewerPage({ params }: WarpViewerPageProps) {
  const data = await getWarp(params.hash);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Warp Not Found</h1>
        <p className="text-gray-500">This Warp link may have expired or is invalid.</p>
        <a href="/marketplace" className="text-blue-600 underline">Browse Marketplace</a>
      </div>
    );
  }

  const { warp, meta } = data;
  const title       = typeof warp.title === 'string' ? warp.title : (warp.title?.en ?? 'Warp');
  const description = typeof warp.description === 'string' ? warp.description : (warp.description?.en ?? '');
  const actions     = (warp.actions ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-block mb-3 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
          AgentBazaar Warp
        </span>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {actions.map((action, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">
                {typeof action.label === 'string' ? action.label : (action.label as Record<string,string>)?.en}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                {String(action.type)}
              </span>
            </div>
            {action.description && (
              <p className="text-sm text-gray-500 mb-4">
                {typeof action.description === 'string' ? action.description : ''}
              </p>
            )}
            {/* Connect wallet CTA */}
            <a
              href={`https://warp.vleap.ai/${meta?.identifier ?? params.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Execute with Wallet →
            </a>
          </div>
        ))}
      </div>

      {/* Meta footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Chain: {String(warp.chain)} · Created by {meta?.creator?.slice(0, 10)}…</p>
        <p className="mt-1">
          <a href="/marketplace" className="underline">Browse AgentBazaar Marketplace</a>
        </p>
      </div>
    </div>
  );
}
