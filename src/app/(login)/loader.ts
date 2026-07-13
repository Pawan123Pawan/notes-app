import { redirect } from 'next/navigation'

import { getCurrentSession } from '@/lib/auth-server'

export async function redirectIfAuthenticated() {
  const session = await getCurrentSession()

  if (session) {
    redirect('/app')
  }
}
