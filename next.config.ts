import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allowedDevOrigins removido - apenas para desenvolvimento local
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
