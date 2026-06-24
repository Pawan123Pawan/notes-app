'use client'

import superjson from 'superjson'
import { useQueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import type { AppRouter } from './routers/_app'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
  })()
  return `${base}/api/trpc`
}
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  const queryClient = useQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    }),
  )
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {props.children}
    </TRPCProvider>
  )
}
