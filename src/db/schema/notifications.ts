import { index, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

import { organization, user } from './auth'

export const workspaceNotificationTypeEnum = [
  'info',
  'success',
  'warning',
  'error',
] as const

export type WorkspaceNotificationType =
  (typeof workspaceNotificationTypeEnum)[number]

export const workspaceNotification = pgTable(
  'workspace_notification',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    type: text('type')
      .$type<WorkspaceNotificationType>()
      .notNull()
      .default('info'),
    actionUrl: text('action_url'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('workspace_notification_user_idx').on(table.userId),
    index('workspace_notification_org_idx').on(table.organizationId),
    index('workspace_notification_user_org_idx').on(
      table.userId,
      table.organizationId,
    ),
    index('workspace_notification_user_org_read_idx').on(
      table.userId,
      table.organizationId,
      table.isRead,
    ),
  ],
)
