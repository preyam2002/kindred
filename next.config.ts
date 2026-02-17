import type { NextConfig } from "next";

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
  // Skip static generation for API routes that require Supabase
  // This prevents build errors when environment variables are not available
  output: 'standalone',
};

export default nextConfig;
