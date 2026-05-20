import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  eslint: {
    dirs: ["app", "components", "lib", "scripts"]
  }
};

export default nextConfig;
