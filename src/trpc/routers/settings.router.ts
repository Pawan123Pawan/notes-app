import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'

import {
  updateAppearanceSettingsSchema,
  updateNotificationSettingsSchema,
  workspaceSettingsScopeSchema,
} from './settings.input'
import {
  getUserWorkspaceAppearance,
  getUserWorkspaceNotificationSettings,
  hasWorkspaceMembership,
  upsertUserWorkspaceAppearance,
  upsertUserWorkspaceNotificationSettings,
} from './settings.service'

export const settingsRouter = createTRPCRouter({
  getAppearance: protectedProcedure
    .input(workspaceSettingsScopeSchema)
    .query(async ({ ctx, input }) => {
      const hasMembership = await hasWorkspaceMembership(
        ctx.user.id,
        input.workspaceId,
      )
      if (!hasMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace.',
        })
      }
      return getUserWorkspaceAppearance(ctx.user.id, input.workspaceId)
    }),
  updateAppearance: protectedProcedure
    .input(updateAppearanceSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const hasMembership = await hasWorkspaceMembership(
        ctx.user.id,
        input.workspaceId,
      )
      if (!hasMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace.',
        })
      }
      return upsertUserWorkspaceAppearance({
        userId: ctx.user.id,
        workspaceId: input.workspaceId,
        theme: input.theme,
        baseColor: input.baseColor,
        accentColor: input.accentColor,
      })
    }),
  getNotifications: protectedProcedure
    .input(workspaceSettingsScopeSchema)
    .query(async ({ ctx, input }) => {
      const hasMembership = await hasWorkspaceMembership(
        ctx.user.id,
        input.workspaceId,
      )
      if (!hasMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace.',
        })
      }
      return getUserWorkspaceNotificationSettings(
        ctx.user.id,
        input.workspaceId,
      )
    }),
  updateNotifications: protectedProcedure
    .input(updateNotificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const hasMembership = await hasWorkspaceMembership(
        ctx.user.id,
        input.workspaceId,
      )
      if (!hasMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace.',
        })
      }
      return upsertUserWorkspaceNotificationSettings({
        userId: ctx.user.id,
        workspaceId: input.workspaceId,
        notifications: input.notifications,
      })
    }),
})
