import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import { BaseButton } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentSession } from '@/lib/auth-server'

import { DashboardView } from './dashboard-view'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Browse your notes by subject.',
}

export default async function AppDashboardPage() {
  const session = await getCurrentSession()

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user.name ?? 'there'}.`}
        extraAction={
          <BaseButton asChild>
            <Link href="/app/new">New note</Link>
          </BaseButton>
        }
      />
      <Suspense fallback={<SubjectsGridSkeleton />}>
        <DashboardView />
      </Suspense>
    </PageContainer>
  )
}
