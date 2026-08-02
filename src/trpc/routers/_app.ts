import { createTRPCRouter } from '@/trpc/init'
import { foldersRouter } from '@/trpc/routers/folders/folders.router'
import { healthRouter } from '@/trpc/routers/health/health.router'
import { notesRouter } from '@/trpc/routers/notes/notes.router'
import { subjectsRouter } from '@/trpc/routers/subjects/subjects.router'

export const appRouter = createTRPCRouter({
  health: healthRouter,
  folders: foldersRouter,
  notes: notesRouter,
  subjects: subjectsRouter,
})

export type AppRouter = typeof appRouter
