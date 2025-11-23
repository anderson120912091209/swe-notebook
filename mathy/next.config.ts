import type { NextConfig } from "next";
import path from "path";
import path from "path";

const nextConfig: NextConfig = {
  // Enable static export for Electron
  output: process.env.NODE_ENV === 'production' && process.env.ELECTRON === 'true' ? 'export' : undefined,

  // Disable image optimization for static export
  images: {
    unoptimized: process.env.ELECTRON === 'true',
  },

  // Configure for Electron
  trailingSlash: true,

  // Remove experimental.esmExternals for Turbopack compatibility
  // This was causing the Turbopack error

  // Enable symlinks for npm link (mathlive fork)
  webpack: (config) => {
    config.resolve.symlinks = true;
    return config;
  },
};

export default nextConfig;
