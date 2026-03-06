import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Bundle analyzer for production builds
  // Run with: ANALYZE=true npm run build
  ...(process.env.ANALYZE === "true" && {
    bundleAnalysis: {
      enabled: true,
    },
  }),
};

export default nextConfig;
