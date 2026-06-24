import * as z from 'zod'

import {
  appearanceAccentColorEnum,
  appearanceBaseColorEnum,
  appearanceThemeEnum,
  workspaceNotificationDefaults,
} from '@/db/schema/settings'

export const workspaceSettingsScopeSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace id is required.'),
})

export const updateAppearanceSettingsSchema =
  workspaceSettingsScopeSchema.extend({
    theme: z.enum(appearanceThemeEnum),
    baseColor: z.enum(appearanceBaseColorEnum),
    accentColor: z.enum(appearanceAccentColorEnum),
  })

export const workspaceNotificationSettingsSchema = z.object(
  Object.fromEntries(
    Object.keys(workspaceNotificationDefaults).map((key) => [key, z.boolean()]),
  ) as Record<keyof typeof workspaceNotificationDefaults, z.ZodBoolean>,
)

export const updateNotificationSettingsSchema =
  workspaceSettingsScopeSchema.extend({
    notifications: workspaceNotificationSettingsSchema,
  })
