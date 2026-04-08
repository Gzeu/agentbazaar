import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agentbazaar/sdk", "@agentbazaar/shared"],
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
