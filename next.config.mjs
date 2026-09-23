/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  env: {
    API_TOKEN: process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN || '',
    API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.coderli.com',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.luogu.com.cn',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure Next.js doesn't fail build on minor linter warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
