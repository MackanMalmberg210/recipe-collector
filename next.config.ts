import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.5.17",
    "192.168.5.17:3000",
    "localhost",
    "localhost:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
