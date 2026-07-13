import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

import { getAuth, type Session } from '@/lib/auth'

export async function createTRPCContext(opts: { headers: Headers }) {
  const auth = await getAuth()
  const session = await auth.api.getSession({ headers: opts.headers })

  return {
    session,
    headers: opts.headers,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

type ProtectedContext = TRPCContext & {
  session: Session
  user: Session['user']
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const protectedCtx: ProtectedContext = {
    ...ctx,
    session: ctx.session,
    user: ctx.session.user,
  }

  return next({ ctx: protectedCtx })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
