import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable static export for Electron
  output: process.env.NODE_ENV === 'production' && process.env.ELECTRON === 'true' ? 'export' : undefined,

  // Disable image optimization for static export
  images: {
    unoptimized: process.env.ELECTRON === 'true',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // Configure for Electron
  trailingSlash: true,

  // PostHog rewrites
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Remove experimental.esmExternals for Turbopack compatibility
  // This was causing the Turbopack error

  // Enable symlinks for npm link (mathlive fork)
  webpack: (config) => {
    config.resolve.symlinks = true;
    return config;
  },
};

export default nextConfig;
