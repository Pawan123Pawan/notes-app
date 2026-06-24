import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { NotificationsPageClient } from './notifications-page-client'
import {
  getCurrentSession,
  getLoginPath,
  getUserWorkspaces,
} from '@/lib/auth-server'

type WorkspaceNotificationsPageProps = {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const metadata: Metadata = {
  title: 'Notifications',
  description:
    'Review workspace notifications, mark items as read or unread, and clean up alerts.',
}

export default async function WorkspaceNotificationsPage({
  params,
}: WorkspaceNotificationsPageProps) {
  const { workspaceSlug } = await params
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath(`/app/${workspaceSlug}/notifications`))
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

  return <NotificationsPageClient workspaceSlug={workspace.workspaceSlug} />
}
