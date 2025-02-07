/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  async rewrites() {
    return [
      {
        source: "/ws",
        destination: "http://localhost:3001",
      },
    ];
  },
};
