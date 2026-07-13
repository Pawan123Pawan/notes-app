import { Schema, model, models } from 'mongoose'

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
export const userNotificationSettingKeys = [
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
  'issueAssignedToMe',
] as const

export type AppearanceTheme = (typeof appearanceThemeEnum)[number]
export type AppearanceBaseColor = (typeof appearanceBaseColorEnum)[number]
export type AppearanceAccentColor = (typeof appearanceAccentColorEnum)[number]
export type UserNotificationSettingKey =
  (typeof userNotificationSettingKeys)[number]
export type UserNotificationSettings = Record<
  UserNotificationSettingKey,
  boolean
>

export const userNotificationDefaults: UserNotificationSettings = {
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
  issueAssignedToMe: true,
}

const userAppearanceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    theme: {
      type: String,
      enum: appearanceThemeEnum,
      required: true,
      default: 'system',
    },
    baseColor: {
      type: String,
      enum: appearanceBaseColorEnum,
      required: true,
      default: 'neutral',
    },
    accentColor: {
      type: String,
      enum: appearanceAccentColorEnum,
      required: true,
      default: 'blue',
    },
  },
  { timestamps: true, collection: 'user_appearance' },
)

const userNotificationSettingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    authNewLoginDetected: { type: Boolean, required: true, default: true },
    authPasswordChanged: { type: Boolean, required: true, default: true },
    authTwoFactorStatusChanged: {
      type: Boolean,
      required: true,
      default: true,
    },
    authAccountDeletionInitiated: {
      type: Boolean,
      required: true,
      default: true,
    },
    workspaceInvitationReceived: {
      type: Boolean,
      required: true,
      default: true,
    },
    workspaceInvitationResponse: {
      type: Boolean,
      required: true,
      default: true,
    },
    workspaceMemberJoined: { type: Boolean, required: true, default: true },
    workspaceMemberLeft: { type: Boolean, required: true, default: true },
    workspaceMemberRemoved: { type: Boolean, required: true, default: true },
    workspaceRoleChanged: { type: Boolean, required: true, default: true },
    workspaceSettingsUpdated: {
      type: Boolean,
      required: true,
      default: true,
    },
    workspaceDeleted: { type: Boolean, required: true, default: true },
    issueAssignedToMe: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'user_notification_settings' },
)

export const UserAppearance =
  models.UserAppearance ||
  model('UserAppearance', userAppearanceSchema, 'user_appearance')

export const UserNotificationSettings =
  models.UserNotificationSettings ||
  model(
    'UserNotificationSettings',
    userNotificationSettingsSchema,
    'user_notification_settings',
  )
