// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable server actions (if needed later)
  experimental: {
    serverActions: true,
  },
};
export default nextConfig;
