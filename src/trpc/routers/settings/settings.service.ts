import { eq } from 'drizzle-orm'

import { db } from '@/db'
import {
  userAppearance,
  userNotificationDefaults,
  userNotificationSettingKeys,
  userNotificationSettings,
} from '@/db/schema'
import type {
  AppearanceAccentColor,
  AppearanceBaseColor,
  AppearanceTheme,
} from '@/lib/appearance'

const userNotificationColumns = Object.fromEntries(
  userNotificationSettingKeys.map((key) => [
    key,
    userNotificationSettings[key],
  ]),
) as {
  [K in (typeof userNotificationSettingKeys)[number]]: (typeof userNotificationSettings)[K]
}

export async function getUserAppearance(userId: string): Promise<{
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}> {
  const [appearance] = await db
    .select({
      theme: userAppearance.theme,
      baseColor: userAppearance.baseColor,
      accentColor: userAppearance.accentColor,
    })
    .from(userAppearance)
    .where(eq(userAppearance.userId, userId))
    .limit(1)

  return {
    theme: appearance?.theme ?? 'system',
    baseColor: appearance?.baseColor ?? 'neutral',
    accentColor: appearance?.accentColor ?? 'blue',
  }
}

export async function upsertUserAppearance(input: {
  userId: string
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}) {
  const [appearance] = await db
    .insert(userAppearance)
    .values({
      userId: input.userId,
      theme: input.theme,
      baseColor: input.baseColor,
      accentColor: input.accentColor,
    })
    .onConflictDoUpdate({
      target: userAppearance.userId,
      set: {
        theme: input.theme,
        baseColor: input.baseColor,
        accentColor: input.accentColor,
        updatedAt: new Date(),
      },
    })
    .returning({
      theme: userAppearance.theme,
      baseColor: userAppearance.baseColor,
      accentColor: userAppearance.accentColor,
    })

  return appearance
}

export async function getUserNotificationSettings(userId: string) {
  const [notificationSettings] = await db
    .select(userNotificationColumns)
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .limit(1)

  return notificationSettings ?? userNotificationDefaults
}

export async function upsertUserNotificationSettings(input: {
  userId: string
  notifications: typeof userNotificationDefaults
}) {
  const [notificationSettings] = await db
    .insert(userNotificationSettings)
    .values({
      userId: input.userId,
      ...input.notifications,
    })
    .onConflictDoUpdate({
      target: userNotificationSettings.userId,
      set: {
        ...input.notifications,
        updatedAt: new Date(),
      },
    })
    .returning(userNotificationColumns)

  return notificationSettings
}
