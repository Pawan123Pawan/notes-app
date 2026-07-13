import { headers } from 'next/headers'

import { createCallerFactory, createTRPCContext } from '@/trpc/init'
import { appRouter } from '@/trpc/routers/_app'

const createCaller = createCallerFactory(appRouter)

export async function createServerCaller() {
  const ctx = await createTRPCContext({ headers: await headers() })
  return createCaller(ctx)
}
