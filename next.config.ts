import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.zhurieandco.shop" }],
        destination: "https://zhurieandco.shop/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
