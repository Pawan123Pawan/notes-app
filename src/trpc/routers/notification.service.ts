import { and, desc, eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { workspaceNotification } from '@/db/schema'
import { getWorkspaceIdForUserBySlug } from './workspaces.service'

export async function requireWorkspaceIdForUser(
  userId: string,
  workspaceSlug: string,
) {
  const workspaceId = await getWorkspaceIdForUserBySlug(userId, workspaceSlug)
  return workspaceId
}

export async function listWorkspaceNotifications(
  userId: string,
  workspaceId: string,
) {
  return db
    .select({
      id: workspaceNotification.id,
      title: workspaceNotification.title,
      body: workspaceNotification.body,
      type: workspaceNotification.type,
      actionUrl: workspaceNotification.actionUrl,
      isRead: workspaceNotification.isRead,
      readAt: workspaceNotification.readAt,
      createdAt: workspaceNotification.createdAt,
    })
    .from(workspaceNotification)
    .where(
      and(
        eq(workspaceNotification.userId, userId),
        eq(workspaceNotification.organizationId, workspaceId),
      ),
    )
    .orderBy(desc(workspaceNotification.createdAt))
}

export async function bulkMarkWorkspaceNotifications(input: {
  userId: string
  workspaceId: string
  all?: boolean
  notificationIds?: string[]
  markAs: 'read' | 'unread'
}) {
  const whereClause = input.all
    ? and(
        eq(workspaceNotification.userId, input.userId),
        eq(workspaceNotification.organizationId, input.workspaceId),
      )
    : and(
        eq(workspaceNotification.userId, input.userId),
        eq(workspaceNotification.organizationId, input.workspaceId),
        inArray(workspaceNotification.id, input.notificationIds ?? []),
      )

  const now = new Date()
  const updated = await db
    .update(workspaceNotification)
    .set(
      input.markAs === 'read'
        ? {
            isRead: true,
            readAt: now,
            updatedAt: now,
          }
        : {
            isRead: false,
            readAt: null,
            updatedAt: now,
          },
    )
    .where(whereClause)
    .returning({ id: workspaceNotification.id })

  return { updatedCount: updated.length }
}

export async function bulkDeleteWorkspaceNotifications(input: {
  userId: string
  workspaceId: string
  all?: boolean
  notificationIds?: string[]
}) {
  const whereClause = input.all
    ? and(
        eq(workspaceNotification.userId, input.userId),
        eq(workspaceNotification.organizationId, input.workspaceId),
      )
    : and(
        eq(workspaceNotification.userId, input.userId),
        eq(workspaceNotification.organizationId, input.workspaceId),
        inArray(workspaceNotification.id, input.notificationIds ?? []),
      )

  const removed = await db
    .delete(workspaceNotification)
    .where(whereClause)
    .returning({ id: workspaceNotification.id })

  return { deletedCount: removed.length }
}
