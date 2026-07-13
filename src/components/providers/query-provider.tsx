'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let browserQueryClient: QueryClient

function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient()
  }

  if (!browserQueryClient) {
    browserQueryClient = new QueryClient()
  }

  return browserQueryClient
}

export function QueryProvider({ children }: React.PropsWithChildren) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
