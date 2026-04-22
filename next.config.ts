import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.xx.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'video-bom2-1.xx.fbcdn.net',
      },
    ],
  },
}

export default nextConfig