import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "localhost:3070",
    "127.0.0.1:3070",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
