import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "letankim.id.vn",
        pathname: "/3do/assets/images/**",
      },
    ],
  },
};

export default nextConfig;
