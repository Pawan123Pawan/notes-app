import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

import { organization, user } from './auth'

export const appearanceThemeEnum = ['system', 'light', 'dark'] as const
export const appearanceBaseColorEnum = [
  'neutral',
  'stone',
  'zinc',
  'mauve',
  'olive',
  'mist',
  'taupe',
] as const
export const appearanceAccentColorEnum = [
  'slate',
  'blue',
  'green',
  'orange',
  'pink',
] as const
export const workspaceNotificationSettingKeys = [
  'authNewLoginDetected',
  'authPasswordChanged',
  'authTwoFactorStatusChanged',
  'authAccountDeletionInitiated',
  'workspaceInvitationReceived',
  'workspaceInvitationResponse',
  'workspaceMemberJoined',
  'workspaceMemberLeft',
  'workspaceMemberRemoved',
  'workspaceRoleChanged',
  'workspaceSettingsUpdated',
  'workspaceDeleted',
] as const

export type AppearanceTheme = (typeof appearanceThemeEnum)[number]
export type AppearanceBaseColor = (typeof appearanceBaseColorEnum)[number]
export type AppearanceAccentColor = (typeof appearanceAccentColorEnum)[number]
export type WorkspaceNotificationSettingKey =
  (typeof workspaceNotificationSettingKeys)[number]
export type WorkspaceNotificationSettings = Record<
  WorkspaceNotificationSettingKey,
  boolean
>

export const workspaceNotificationDefaults: WorkspaceNotificationSettings = {
  authNewLoginDetected: true,
  authPasswordChanged: true,
  authTwoFactorStatusChanged: true,
  authAccountDeletionInitiated: true,
  workspaceInvitationReceived: true,
  workspaceInvitationResponse: true,
  workspaceMemberJoined: true,
  workspaceMemberLeft: true,
  workspaceMemberRemoved: true,
  workspaceRoleChanged: true,
  workspaceSettingsUpdated: true,
  workspaceDeleted: true,
}

export const userWorkspaceAppearance = pgTable(
  'user_workspace_appearance',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    theme: text('theme').$type<AppearanceTheme>().notNull().default('system'),
    baseColor: text('base_color')
      .$type<AppearanceBaseColor>()
      .notNull()
      .default('neutral'),
    accentColor: text('accent_color')
      .$type<AppearanceAccentColor>()
      .notNull()
      .default('blue'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.organizationId],
      name: 'user_workspace_appearance_pk',
    }),
    index('user_workspace_appearance_user_idx').on(table.userId),
    index('user_workspace_appearance_org_idx').on(table.organizationId),
  ],
)

export const userWorkspaceNotificationSettings = pgTable(
  'user_workspace_notification_settings',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    authNewLoginDetected: boolean('auth_new_login_detected')
      .notNull()
      .default(true),
    authPasswordChanged: boolean('auth_password_changed')
      .notNull()
      .default(true),
    authTwoFactorStatusChanged: boolean('auth_two_factor_status_changed')
      .notNull()
      .default(true),
    authAccountDeletionInitiated: boolean('auth_account_deletion_initiated')
      .notNull()
      .default(true),
    workspaceInvitationReceived: boolean('workspace_invitation_received')
      .notNull()
      .default(true),
    workspaceInvitationResponse: boolean('workspace_invitation_response')
      .notNull()
      .default(true),
    workspaceMemberJoined: boolean('workspace_member_joined')
      .notNull()
      .default(true),
    workspaceMemberLeft: boolean('workspace_member_left')
      .notNull()
      .default(true),
    workspaceMemberRemoved: boolean('workspace_member_removed')
      .notNull()
      .default(true),
    workspaceRoleChanged: boolean('workspace_role_changed')
      .notNull()
      .default(true),
    workspaceSettingsUpdated: boolean('workspace_settings_updated')
      .notNull()
      .default(true),
    workspaceDeleted: boolean('workspace_deleted').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.organizationId],
      name: 'user_workspace_notification_settings_pk',
    }),
    index('user_workspace_notification_settings_user_idx').on(table.userId),
    index('user_workspace_notification_settings_org_idx').on(
      table.organizationId,
    ),
  ],
)
