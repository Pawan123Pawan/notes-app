import { createTRPCRouter } from '@/trpc/init'
import { healthRouter } from '@/trpc/routers/health/health.router'
import { notesRouter } from '@/trpc/routers/notes/notes.router'
import { subjectsRouter } from '@/trpc/routers/subjects/subjects.router'

export const appRouter = createTRPCRouter({
  health: healthRouter,
  notes: notesRouter,
  subjects: subjectsRouter,
})

export type AppRouter = typeof appRouter
