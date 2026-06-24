import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'

import { AcceptInvitationCard } from '@/app/(app)/app/accept-invitation/accept-invitation-card'
import { db } from '@/db'
import { invitation, organization } from '@/db/schema'
import { getCurrentSession, getLoginPath } from '@/lib/auth-server'

type AcceptInvitationPageProps = {
  searchParams: Promise<{
    id?: string
  }>
}

export const metadata: Metadata = {
  title: 'Accept invitation',
  description:
    'Accept your workspace invitation and continue into the authenticated product.',
}

export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const { id } = await searchParams
  const invitationId = id?.trim()
  if (!invitationId) {
    redirect('/app')
  }

  const returnTo = `/app/accept-invitation?id=${encodeURIComponent(invitationId)}`
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath(returnTo))
  }

  const [invite] = await db
    .select({
      invitationId: invitation.id,
      inviteeEmail: invitation.email,
      status: invitation.status,
      workspaceId: organization.id,
      workspaceName: organization.name,
      workspaceSlug: organization.slug,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .where(
      and(
        eq(invitation.id, invitationId),
        eq(invitation.email, session.user.email),
      ),
    )
    .limit(1)

  if (!invite || invite.status !== 'pending') {
    redirect('/app')
  }

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <AcceptInvitationCard
          invitationId={invite.invitationId}
          workspaceId={invite.workspaceId}
          workspaceName={invite.workspaceName}
          workspaceSlug={invite.workspaceSlug}
        />
      </div>
    </div>
  )
}
