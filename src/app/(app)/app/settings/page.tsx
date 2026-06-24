import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SettingsClient } from './settings-client'
import { getCurrentSession, getLoginPath } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Manage your profile, security, password, and account preferences.',
}

export default async function AppSettingsPage() {
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath('/app/settings'))
  }

  return <SettingsClient />
}
