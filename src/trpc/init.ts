import { auth } from '@/lib/auth'
import { TRPCError } from '@trpc/server'
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
/**
 * This context creator accepts `headers` so it can be reused in both
 * the RSC server caller (where you pass `next/headers`) and the
 * API route handler (where you pass the request headers).
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers })
  return { session: session?.session, user: session?.user }
}
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: superjson,
  })
// Base router and procedure helpers
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to access this resource.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
