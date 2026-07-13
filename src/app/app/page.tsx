import type { Metadata } from 'next'

import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentSession } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your notes workspace.',
}

export default async function AppDashboardPage() {
  const session = await getCurrentSession()

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user.name ?? 'there'}.`}
      />
      <p className="text-muted-foreground text-sm">
        Your notes collection will appear here.
      </p>
    </PageContainer>
  )
}
