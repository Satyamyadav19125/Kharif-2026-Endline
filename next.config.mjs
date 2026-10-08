/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Gzip responses so the (already small) summary payloads cost even less
  // outbound transfer on Vercel.
  compress: true,
  experimental: {
    // Pre-bundle the mongodb driver into the server runtime so cold starts
    // are a little lighter.
    serverComponentsExternalPackages: ["mongodb"],
  },
};

export default nextConfig;
