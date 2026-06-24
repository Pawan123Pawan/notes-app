import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { member, organization } from '@/db/schema'

export async function getUserWorkspaces(userId: string) {
  return db
    .select({
      workspaceId: organization.id,
      workspaceName: organization.name,
      workspaceSlug: organization.slug,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId))
}

export async function getPrimaryWorkspace(userId: string) {
  const [workspace] = await getUserWorkspaces(userId)
  return workspace ?? null
}

export async function getWorkspaceIdForUserBySlug(
  userId: string,
  workspaceSlug: string,
) {
  const [workspace] = await db
    .select({ workspaceId: organization.id })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.slug, workspaceSlug)))
    .limit(1)

  return workspace?.workspaceId ?? null
}
