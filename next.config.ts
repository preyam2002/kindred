import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable Fast Refresh for hot reloading
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
