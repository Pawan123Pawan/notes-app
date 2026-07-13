import { getCurrentSession, getLoginPath } from '@/lib/auth-server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: React.PropsWithChildren) {
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath('/app'))
  }

  return children
}
