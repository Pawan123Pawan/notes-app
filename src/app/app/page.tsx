import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { NotesGridSkeleton } from '@/components/app-skeletons'
import { BaseButton } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentSession } from '@/lib/auth-server'

import { RecentNotes } from './recent-notes'

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
        extraAction={
          <BaseButton asChild>
            <Link href="/app/new">New note</Link>
          </BaseButton>
        }
      />
      <Suspense fallback={<NotesGridSkeleton />}>
        <RecentNotes />
      </Suspense>
    </PageContainer>
  )
}
