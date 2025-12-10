import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ✅ REQUIRED for Docker standalone builds
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.ap-southeast-1.wasabisys.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
