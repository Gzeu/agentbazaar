'use client';

import React, { useState, useCallback } from 'react';
import QRCode from 'qrcode';

interface WarpShareButtonProps {
  serviceId: string;
  className?: string;
}

interface PublishResult {
  hash: string;
  alias?: string;
  url: string;
}

export function WarpShareButton({ serviceId, className = '' }: WarpShareButtonProps) {
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<PublishResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Warp JSON from backend
      const warpRes = await fetch(`/api/warps/${serviceId}`);
      if (!warpRes.ok) throw new Error('Failed to fetch Warp');
      const warpJson = await warpRes.json();

      // 2. Publish to registry
      const publishRes = await fetch('/api/warps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warpJson: JSON.stringify(warpJson) }),
      });
      if (!publishRes.ok) throw new Error('Failed to publish Warp');
      const publishData: PublishResult = await publishRes.json();
      setResult(publishData);

      // 3. Generate QR code
      const qr = await QRCode.toDataURL(publishData.url, { width: 256, margin: 2 });
      setQrDataUrl(qr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  const handleCopy = useCallback(async () => {
    if (!result?.url) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span>🔗</span>
        )}
        Share Warp
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {result && qrDataUrl && (
        <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white shadow-lg w-72">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Warp Link</p>
          <div className="flex items-center gap-2 mb-3">
            <input
              readOnly
              value={result.url}
              className="flex-1 text-xs border rounded px-2 py-1 bg-gray-50 truncate"
            />
            <button
              onClick={handleCopy}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <img src={qrDataUrl} alt="Warp QR Code" className="w-full rounded" />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Scan to execute this transaction
          </p>
        </div>
      )}
    </div>
  );
}

export default WarpShareButton;
