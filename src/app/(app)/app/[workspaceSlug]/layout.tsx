import { redirect } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import {
  getCurrentSession,
  getLoginPath,
  getUserWorkspaceAppearance,
  getUserWorkspaces,
} from '@/lib/auth-server'

type WorkspaceLayoutProps = React.PropsWithChildren<{
  params: Promise<{
    workspaceSlug: string
  }>
}>

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath(`/app/${workspaceSlug}`))
  }

  const workspaces = await getUserWorkspaces(session.user.id)
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.workspaceSlug === workspaceSlug,
  )

  if (!activeWorkspace) {
    if (workspaces.length > 0) {
      redirect(`/app/${workspaces[0].workspaceSlug}`)
    }
    redirect('/app/onboarding')
  }

  const appearance = await getUserWorkspaceAppearance(
    session.user.id,
    activeWorkspace.workspaceId,
  )

  return (
    <AppShell
      workspaceSlug={workspaceSlug}
      workspaceId={activeWorkspace.workspaceId}
      initialAppearance={appearance}
    >
      {children}
    </AppShell>
  )
}
