import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@agentbazaar/sdk",
    "@agentbazaar/shared",
    "@multiversx/sdk-dapp",
    "@multiversx/sdk-dapp-ui",
  ],
  webpack: (config) => {
    // needed by sdk-dapp for some sub-packages that use require()
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
