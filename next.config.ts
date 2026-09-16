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
      {
        source: "/api/foods",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/foods"
            : "/api/foods",
      },
      {
        source: "/api/categories",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/categories"
            : "/api/categories",
      },
      {
        source: "/api/restaurants",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/restaurants"
            : "/api/restaurants",
      },
      {
        source: "/api/restaurants/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/restaurants/:path*"
            : "/api/restaurants/:path*",
      },
      {
        source: "/api/recommendations/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/recommendations/:path*"
            : "/api/recommendations/:path*",
      },
      {
        source: "/api/reviews",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/reviews"
            : "/api/reviews",
      },
    ];
  },
};

export default nextConfig;
