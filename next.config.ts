import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set Turbopack root to this directory (fixes Windows symlink issues)
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    // Disable TypeScript checking during builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
