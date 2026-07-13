import { redirect } from 'next/navigation'

import { getCurrentSession } from '@/lib/auth-server'

export async function requireSession() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login?returnTo=/app')
  }

  return session
}
