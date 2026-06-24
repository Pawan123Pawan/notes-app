import { createTRPCRouter, protectedProcedure } from '@/trpc/init'

import {
  updateAppearanceSettingsSchema,
  updateNotificationSettingsSchema,
} from './settings.input'
import {
  getUserAppearance,
  getUserNotificationSettings,
  upsertUserAppearance,
  upsertUserNotificationSettings,
} from './settings.service'

export const settingsRouter = createTRPCRouter({
  getAppearance: protectedProcedure.query(async ({ ctx }) => {
    return getUserAppearance(ctx.user.id)
  }),
  updateAppearance: protectedProcedure
    .input(updateAppearanceSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertUserAppearance({
        userId: ctx.user.id,
        theme: input.theme,
        baseColor: input.baseColor,
        accentColor: input.accentColor,
      })
    }),
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return getUserNotificationSettings(ctx.user.id)
  }),
  updateNotifications: protectedProcedure
    .input(updateNotificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertUserNotificationSettings({
        userId: ctx.user.id,
        notifications: input.notifications,
      })
    }),
})
