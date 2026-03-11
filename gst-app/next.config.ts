import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/login', destination: '/auth/login', permanent: true },
      { source: '/signup', destination: '/auth/signup', permanent: true },
      { source: '/reset-password', destination: '/auth/reset-password', permanent: true },
      { source: '/gst', destination: '/gst-center', permanent: true },
    ];
  },
};

export default nextConfig;
