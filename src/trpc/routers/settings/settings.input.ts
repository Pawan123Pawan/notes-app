import * as z from 'zod'

import {
  appearanceAccentColorEnum,
  appearanceBaseColorEnum,
  appearanceThemeEnum,
  userNotificationDefaults,
} from '@/db/schema/settings'

export const updateAppearanceSettingsSchema = z.object({
  theme: z.enum(appearanceThemeEnum),
  baseColor: z.enum(appearanceBaseColorEnum),
  accentColor: z.enum(appearanceAccentColorEnum),
})

export const userNotificationSettingsSchema = z.object(
  Object.fromEntries(
    Object.keys(userNotificationDefaults).map((key) => [key, z.boolean()]),
  ) as Record<keyof typeof userNotificationDefaults, z.ZodBoolean>,
)

export const updateNotificationSettingsSchema = z.object({
  notifications: userNotificationSettingsSchema,
})
