import { createTRPCRouter } from '@/trpc/init'
import { healthRouter } from '@/trpc/routers/health/health.router'
import { notesRouter } from '@/trpc/routers/notes/notes.router'

export const appRouter = createTRPCRouter({
  health: healthRouter,
  notes: notesRouter,
})

export type AppRouter = typeof appRouter
