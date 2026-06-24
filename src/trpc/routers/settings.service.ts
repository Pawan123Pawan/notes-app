import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import {
  member,
  userWorkspaceAppearance,
  userWorkspaceNotificationSettings,
  workspaceNotificationDefaults,
} from '@/db/schema'
import type {
  AppearanceAccentColor,
  AppearanceBaseColor,
  AppearanceTheme,
} from '@/lib/appearance'

export async function hasWorkspaceMembership(
  userId: string,
  organizationId: string,
) {
  const workspaceMember = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, userId),
    ),
    columns: { userId: true },
  })

  return Boolean(workspaceMember)
}

export async function getUserWorkspaceAppearance(
  userId: string,
  workspaceId: string,
): Promise<{
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}> {
  const [appearance] = await db
    .select({
      theme: userWorkspaceAppearance.theme,
      baseColor: userWorkspaceAppearance.baseColor,
      accentColor: userWorkspaceAppearance.accentColor,
    })
    .from(userWorkspaceAppearance)
    .where(
      and(
        eq(userWorkspaceAppearance.organizationId, workspaceId),
        eq(userWorkspaceAppearance.userId, userId),
      ),
    )
    .limit(1)

  return {
    theme: appearance?.theme ?? 'system',
    baseColor: appearance?.baseColor ?? 'neutral',
    accentColor: appearance?.accentColor ?? 'blue',
  }
}

export async function upsertUserWorkspaceAppearance(input: {
  userId: string
  workspaceId: string
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}) {
  const [appearance] = await db
    .insert(userWorkspaceAppearance)
    .values({
      userId: input.userId,
      organizationId: input.workspaceId,
      theme: input.theme,
      baseColor: input.baseColor,
      accentColor: input.accentColor,
    })
    .onConflictDoUpdate({
      target: [
        userWorkspaceAppearance.userId,
        userWorkspaceAppearance.organizationId,
      ],
      set: {
        theme: input.theme,
        baseColor: input.baseColor,
        accentColor: input.accentColor,
        updatedAt: new Date(),
      },
    })
    .returning({
      theme: userWorkspaceAppearance.theme,
      baseColor: userWorkspaceAppearance.baseColor,
      accentColor: userWorkspaceAppearance.accentColor,
    })

  return appearance
}

export async function getUserWorkspaceNotificationSettings(
  userId: string,
  workspaceId: string,
) {
  const [notificationSettings] = await db
    .select({
      authNewLoginDetected:
        userWorkspaceNotificationSettings.authNewLoginDetected,
      authPasswordChanged:
        userWorkspaceNotificationSettings.authPasswordChanged,
      authTwoFactorStatusChanged:
        userWorkspaceNotificationSettings.authTwoFactorStatusChanged,
      authAccountDeletionInitiated:
        userWorkspaceNotificationSettings.authAccountDeletionInitiated,
      workspaceInvitationReceived:
        userWorkspaceNotificationSettings.workspaceInvitationReceived,
      workspaceInvitationResponse:
        userWorkspaceNotificationSettings.workspaceInvitationResponse,
      workspaceMemberJoined:
        userWorkspaceNotificationSettings.workspaceMemberJoined,
      workspaceMemberLeft:
        userWorkspaceNotificationSettings.workspaceMemberLeft,
      workspaceMemberRemoved:
        userWorkspaceNotificationSettings.workspaceMemberRemoved,
      workspaceRoleChanged:
        userWorkspaceNotificationSettings.workspaceRoleChanged,
      workspaceSettingsUpdated:
        userWorkspaceNotificationSettings.workspaceSettingsUpdated,
      workspaceDeleted: userWorkspaceNotificationSettings.workspaceDeleted,
    })
    .from(userWorkspaceNotificationSettings)
    .where(
      and(
        eq(userWorkspaceNotificationSettings.organizationId, workspaceId),
        eq(userWorkspaceNotificationSettings.userId, userId),
      ),
    )
    .limit(1)

  return notificationSettings ?? workspaceNotificationDefaults
}

export async function upsertUserWorkspaceNotificationSettings(input: {
  userId: string
  workspaceId: string
  notifications: typeof workspaceNotificationDefaults
}) {
  const [notificationSettings] = await db
    .insert(userWorkspaceNotificationSettings)
    .values({
      userId: input.userId,
      organizationId: input.workspaceId,
      ...input.notifications,
    })
    .onConflictDoUpdate({
      target: [
        userWorkspaceNotificationSettings.userId,
        userWorkspaceNotificationSettings.organizationId,
      ],
      set: {
        ...input.notifications,
        updatedAt: new Date(),
      },
    })
    .returning({
      authNewLoginDetected:
        userWorkspaceNotificationSettings.authNewLoginDetected,
      authPasswordChanged:
        userWorkspaceNotificationSettings.authPasswordChanged,
      authTwoFactorStatusChanged:
        userWorkspaceNotificationSettings.authTwoFactorStatusChanged,
      authAccountDeletionInitiated:
        userWorkspaceNotificationSettings.authAccountDeletionInitiated,
      workspaceInvitationReceived:
        userWorkspaceNotificationSettings.workspaceInvitationReceived,
      workspaceInvitationResponse:
        userWorkspaceNotificationSettings.workspaceInvitationResponse,
      workspaceMemberJoined:
        userWorkspaceNotificationSettings.workspaceMemberJoined,
      workspaceMemberLeft:
        userWorkspaceNotificationSettings.workspaceMemberLeft,
      workspaceMemberRemoved:
        userWorkspaceNotificationSettings.workspaceMemberRemoved,
      workspaceRoleChanged:
        userWorkspaceNotificationSettings.workspaceRoleChanged,
      workspaceSettingsUpdated:
        userWorkspaceNotificationSettings.workspaceSettingsUpdated,
      workspaceDeleted: userWorkspaceNotificationSettings.workspaceDeleted,
    })

  return notificationSettings
}
