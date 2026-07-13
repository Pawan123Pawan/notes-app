import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init'

export const healthRouter = createTRPCRouter({
  ping: baseProcedure.query(() => ({
    ok: true as const,
    at: new Date(),
  })),

  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    email: ctx.user.email,
    name: ctx.user.name,
  })),
})
