import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { MembersPageClient } from '@/app/(app)/app/[workspaceSlug]/members/members-page-client'
import {
  getCurrentSession,
  getLoginPath,
  getUserWorkspaces,
} from '@/lib/auth-server'

type WorkspaceMembersPageProps = {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const metadata: Metadata = {
  title: 'Members',
  description:
    'Invite teammates, manage workspace roles, and review pending invitations.',
}

export default async function WorkspaceMembersPage({
  params,
}: WorkspaceMembersPageProps) {
  const { workspaceSlug } = await params
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath(`/app/${workspaceSlug}/members`))
  }

  const workspaces = await getUserWorkspaces(session.user.id)
  const workspace = workspaces.find(
    (item) => item.workspaceSlug === workspaceSlug,
  )

  if (!workspace) {
    if (workspaces.length > 0) {
      redirect(`/app/${workspaces[0].workspaceSlug}`)
    }

    redirect('/app/onboarding')
  }

  return (
    <MembersPageClient
      workspaceId={workspace.workspaceId}
      workspaceName={workspace.workspaceName}
      workspaceSlug={workspace.workspaceSlug}
      currentRole={workspace.role}
    />
  )
}
