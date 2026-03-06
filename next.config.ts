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
      {
        protocol: "http",
        hostname: "192.168.1.110",
        port: "7777",
        pathname: "/assets/machines/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "7777",
        pathname: "/**",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
