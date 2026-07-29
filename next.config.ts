import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.tencent.com" },
      { protocol: "https", hostname: "www.kuaishou.com" },
      { protocol: "https", hostname: "www.meituan.com" },
      { protocol: "https", hostname: "website.didiglobal.com" },
    ],
  },
};

export default nextConfig;
