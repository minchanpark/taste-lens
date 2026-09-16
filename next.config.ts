import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/:path*"
            : "/api/:path*",
      },
      {
        source: "/api/health",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/health"
            : "/api/health",
      },
      {
        source: "/api/taste/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/taste/:path*"
            : "/api/taste/:path*",
      },
    ];
  },
};

export default nextConfig;
