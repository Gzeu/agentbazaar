import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Silence workspace lockfile warning
    root: __dirname,
  },
  // Allow backend API domain in development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
};

export default nextConfig;
