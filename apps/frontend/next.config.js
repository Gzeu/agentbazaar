/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/app',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/app/dashboard',
        permanent: false,
      },
      {
        source: '/tasks',
        destination: '/app/tasks',
        permanent: false,
      },
      {
        source: '/providers',
        destination: '/app/providers',
        permanent: false,
      },
      {
        source: '/services',
        destination: '/app/services',
        permanent: false,
      },
      {
        source: '/services/register',
        destination: '/app/services/register',
        permanent: false,
      },
      {
        source: '/services/:id',
        destination: '/app/services/:id',
        permanent: false,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MVX_NETWORK: process.env.NEXT_PUBLIC_MVX_NETWORK || 'devnet',
  },
};

module.exports = nextConfig;
