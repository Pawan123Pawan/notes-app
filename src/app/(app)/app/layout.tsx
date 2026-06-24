import { AppShell } from '@/components/app-shell'
import { getCurrentSession, getLoginPath } from '@/lib/auth-server'
import { getUserAppearance } from '@/trpc/routers/settings/settings.service'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: React.PropsWithChildren) {
  const headersList = await headers()
  const currentUrl = headersList.get('x-url') ?? '/app'

  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath(currentUrl))
  }

  const appearance = await getUserAppearance(session.user.id)

  return <AppShell initialAppearance={appearance}>{children}</AppShell>
}
