import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SettingsClient } from './settings-client'
import {
  getCurrentSession,
  getLoginPath,
  getUserWorkspaces,
} from '@/lib/auth-server'

type WorkspaceSettingsPageProps = {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Manage your profile, security, password, account deletion, and notification preferences.',
}

export default async function AppSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { workspaceSlug } = await params
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath(`/app/${workspaceSlug}/settings`))
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
    <SettingsClient
      workspaceId={workspace.workspaceId}
      workspaceSlug={workspace.workspaceSlug}
    />
  )
}
