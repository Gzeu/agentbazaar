/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MVX_NETWORK: process.env.NEXT_PUBLIC_MVX_NETWORK || 'devnet',
    NEXT_PUBLIC_REGISTRY_CONTRACT: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT || '',
    NEXT_PUBLIC_ESCROW_CONTRACT: process.env.NEXT_PUBLIC_ESCROW_CONTRACT || '',
  },
};

module.exports = nextConfig;
