import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer", "react-pdf"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these packages on the client side
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-pdf/renderer": false,
        "react-pdf": false,
      };
    }
    return config;
  },
};

export default nextConfig;
