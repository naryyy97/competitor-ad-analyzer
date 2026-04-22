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
  serverExternalPackages: [
    '@sparticuz/chromium',
    'playwright-core',
  ],
  outputFileTracingIncludes: {
    '/api/analyze': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
}

export default nextConfig