import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [{ hostname: 'assets.tailwindplus.com' }],
    dangerouslyAllowSVG: true,
  },
}

export default withPayload(nextConfig)
