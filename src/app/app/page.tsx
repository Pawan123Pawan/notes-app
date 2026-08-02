import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AppPageSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { getCurrentSession } from '@/lib/auth-server'

import { DashboardView } from './dashboard-view'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Browse subjects, notes folders, and notes.',
}

export default async function AppDashboardPage() {
  const session = await getCurrentSession()

  return (
    <PageContainer>
      <Suspense fallback={<AppPageSkeleton />}>
        <DashboardView userName={session?.user.name ?? 'there'} />
      </Suspense>
    </PageContainer>
  )
}
