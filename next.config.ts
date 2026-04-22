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
  // This was previously outside the closing brace
  serverExternalPackages: [
    '@sparticuz/chromium',
    'playwright-core',
  ],
}

export default nextConfig