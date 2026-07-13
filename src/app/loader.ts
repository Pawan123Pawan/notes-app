import { redirect } from 'next/navigation'

import { getCurrentSession } from '@/lib/auth-server'

export async function resolveRootRedirect() {
  const session = await getCurrentSession()

  if (session) {
    redirect('/app')
  }

  redirect('/login')
}
