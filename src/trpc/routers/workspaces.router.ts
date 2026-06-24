import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { getUserWorkspaces } from './workspaces.service'

export const workspacesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserWorkspaces(ctx.user.id)
  }),
})
