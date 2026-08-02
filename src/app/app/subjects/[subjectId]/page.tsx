import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { SubjectDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { createServerCaller } from '@/trpc/server'

import { SubjectDetailView } from './subject-detail-view'

export const metadata: Metadata = {
  title: 'Subject',
  description: 'View and manage notes and notes folders in a subject.',
}

type SubjectPageProps = {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subjectId } = await params
  const caller = await createServerCaller()

  try {
    await caller.subjects.getById({ subjectId })
  } catch {
    notFound()
  }

  return (
    <PageContainer>
      <Suspense fallback={<SubjectDetailSkeleton />}>
        <SubjectDetailView subjectId={subjectId} />
      </Suspense>
    </PageContainer>
  )
}
