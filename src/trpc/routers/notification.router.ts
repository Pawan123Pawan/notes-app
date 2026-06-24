import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import {
  bulkDeleteNotificationsSchema,
  bulkMarkNotificationsSchema,
  workspaceSlugSchema,
} from './notification.input'
import {
  bulkDeleteWorkspaceNotifications,
  bulkMarkWorkspaceNotifications,
  listWorkspaceNotifications,
  requireWorkspaceIdForUser,
} from './notification.service'

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(workspaceSlugSchema)
    .query(async ({ ctx, input }) => {
      const workspaceId = await requireWorkspaceIdForUser(
        ctx.user.id,
        input.workspaceSlug,
      )
      if (!workspaceId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found.',
        })
      }
      return listWorkspaceNotifications(ctx.user.id, workspaceId)
    }),
  bulkMark: protectedProcedure
    .input(bulkMarkNotificationsSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await requireWorkspaceIdForUser(
        ctx.user.id,
        input.workspaceSlug,
      )
      if (!workspaceId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found.',
        })
      }
      return bulkMarkWorkspaceNotifications({
        userId: ctx.user.id,
        workspaceId,
        all: input.all,
        notificationIds: input.notificationIds,
        markAs: input.markAs,
      })
    }),
  bulkDelete: protectedProcedure
    .input(bulkDeleteNotificationsSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await requireWorkspaceIdForUser(
        ctx.user.id,
        input.workspaceSlug,
      )
      if (!workspaceId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found.',
        })
      }
      return bulkDeleteWorkspaceNotifications({
        userId: ctx.user.id,
        workspaceId,
        all: input.all,
        notificationIds: input.notificationIds,
      })
    }),
})
