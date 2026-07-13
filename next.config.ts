import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  serverExternalPackages: [
    'mongodb',
    'mongoose',
    'better-auth',
    '@better-auth/mongo-adapter',
    'bson',
  ],
}

export default nextConfig
