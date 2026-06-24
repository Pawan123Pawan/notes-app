import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  getCurrentSession,
  getLoginPath,
  getPrimaryWorkspace,
} from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Overview of your workspace. Build out charts, shortcuts, and activity here.',
}

export default async function AppHomePage() {
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath('/app'))
  }

  const workspace = await getPrimaryWorkspace(session.user.id)

  if (!workspace) {
    redirect('/app/onboarding')
  }

  redirect(`/app/${workspace.workspaceSlug}`)
}
