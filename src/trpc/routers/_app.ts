import { createTRPCRouter } from '@/trpc/init'
import { healthRouter } from '@/trpc/routers/health/health.router'

export const appRouter = createTRPCRouter({
  health: healthRouter,
})

export type AppRouter = typeof appRouter
