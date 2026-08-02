import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentSession } from '@/lib/auth-server'

import { DashboardView } from './dashboard-view'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Browse subjects, topic folders, and notes.',
}

export default async function AppDashboardPage() {
  const session = await getCurrentSession()

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user.name ?? 'there'}.`}
      />
      <Suspense fallback={<SubjectsGridSkeleton />}>
        <DashboardView />
      </Suspense>
    </PageContainer>
  )
}
