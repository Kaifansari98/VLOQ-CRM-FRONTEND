import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.ap-southeast-1.wasabisys.com",
      },
      {
        protocol: "https",
        hostname: "vloq-furnix.s3.ap-southeast-1.wasabisys.com",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
