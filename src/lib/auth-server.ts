import { headers } from 'next/headers'

import { getAuth } from '@/lib/auth'

export async function getCurrentSession() {
  const auth = await getAuth()
  return auth.api.getSession({
    headers: await headers(),
  })
}
