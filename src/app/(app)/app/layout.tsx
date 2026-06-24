import {
  getCurrentSession,
  isUserOnboarded,
  redirectIfNotAuthenticated,
} from '@/lib/auth-server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: React.PropsWithChildren) {
  const headersList = await headers()
  const currentUrl = headersList.get('x-url') ?? '/app'
  const currentPathname = currentUrl.startsWith('/')
    ? currentUrl
    : (() => {
        try {
          return new URL(currentUrl).pathname
        } catch {
          return '/app'
        }
      })()

  await redirectIfNotAuthenticated(currentUrl)

  const session = await getCurrentSession()
  const isGetStartedRoute = currentPathname.startsWith('/app/get-started')
  if (
    session &&
    !isGetStartedRoute &&
    !(await isUserOnboarded(session.user.id))
  ) {
    redirect('/app/get-started')
  }

  return children
}
