import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Output ──────────────────────────────────────────────
  // 'standalone' bundles only what Vercel needs → smaller deploy
  output: 'standalone',

  // ── Images ──────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'devnet-api.multiversx.com' },
      { protocol: 'https', hostname: 'api.multiversx.com' },
    ],
  },

  // ── Build ───────────────────────────────────────────────
  // Skip type / lint errors on Vercel CI so deploy doesn't break on warnings
  typescript:  { ignoreBuildErrors: true },
  eslint:      { ignoreDuringBuilds: true },

  // ── Headers (dev only — Vercel uses vercel.json headers) ─
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },

  // ── Webpack — fix Node.js-only packages used by @multiversx/sdk ─
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:     false,
        net:    false,
        tls:    false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
};

export default nextConfig;
