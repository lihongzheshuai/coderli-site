/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
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
