import { connectDB } from '@/db'
import {
  UserAppearance,
  UserNotificationSettings,
  userNotificationDefaults,
  userNotificationSettingKeys,
} from '@/db/schema'
import type {
  AppearanceAccentColor,
  AppearanceBaseColor,
  AppearanceTheme,
} from '@/lib/appearance'

const userNotificationSelect = userNotificationSettingKeys.join(' ')

export async function getUserAppearance(userId: string): Promise<{
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}> {
  await connectDB()

  const appearance = await UserAppearance.findOne({ userId })
    .select('theme baseColor accentColor')
    .lean()

  return {
    theme: (appearance?.theme as AppearanceTheme | undefined) ?? 'system',
    baseColor:
      (appearance?.baseColor as AppearanceBaseColor | undefined) ?? 'neutral',
    accentColor:
      (appearance?.accentColor as AppearanceAccentColor | undefined) ?? 'blue',
  }
}

export async function upsertUserAppearance(input: {
  userId: string
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}) {
  await connectDB()

  const appearance = await UserAppearance.findOneAndUpdate(
    { userId: input.userId },
    {
      theme: input.theme,
      baseColor: input.baseColor,
      accentColor: input.accentColor,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .select('theme baseColor accentColor')
    .lean()

  return appearance!
}

export async function getUserNotificationSettings(userId: string) {
  await connectDB()

  const notificationSettings = await UserNotificationSettings.findOne({
    userId,
  })
    .select(userNotificationSelect)
    .lean()

  return notificationSettings ?? userNotificationDefaults
}

export async function upsertUserNotificationSettings(input: {
  userId: string
  notifications: typeof userNotificationDefaults
}) {
  await connectDB()

  const notificationSettings = await UserNotificationSettings.findOneAndUpdate(
    { userId: input.userId },
    input.notifications,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .select(userNotificationSelect)
    .lean()

  return notificationSettings!
}
