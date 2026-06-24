import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  getCurrentSession,
  getLoginPath,
  getPrimaryWorkspace,
  redirectIfNotAuthenticated,
} from '@/lib/auth-server'

import { WorkspaceOnboardingForm } from './workspace-onboarding-form'

export const metadata: Metadata = {
  title: 'Workspace onboarding',
  description:
    'Create your first workspace so you can access the authenticated product area.',
}

export default async function WorkspaceOnboardingPage() {
  await redirectIfNotAuthenticated('/app/onboarding')

  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath('/app/onboarding'))
  }

  const workspace = await getPrimaryWorkspace(session.user.id)
  if (workspace) {
    redirect(`/app/${workspace.workspaceSlug}`)
  }

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <WorkspaceOnboardingForm />
      </div>
    </div>
  )
}
