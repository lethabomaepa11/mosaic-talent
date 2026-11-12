import type { NextConfig } from "next";
import { privatePaths } from "./src/lib/seo";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactCompiler: true,
  async redirects() {
    return [{ source: "/app/projects/:id([0-9a-fA-F-]{36})", destination: "/app/build/:id", permanent: false,
      missing: [{ type: "query", key: "tools" }] }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
        port: "",
        pathname: "/company-logos/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [
      ...privatePaths.map(path => ({ source: `${path}/:path*`, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
