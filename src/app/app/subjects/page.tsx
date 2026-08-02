import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AddSubjectButton } from '@/app/app/subjects/add-subject-button'
import { SubjectsListSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

import { SubjectsView } from './subjects-view'

export const metadata: Metadata = {
  title: 'Subjects',
  description: 'Organize your study notes into subjects and notes folders.',
}

export default function SubjectsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Subjects"
        description="Expand a subject to browse its notes folders, or open it to manage notes."
        extraAction={<AddSubjectButton />}
      />
      <Suspense fallback={<SubjectsListSkeleton />}>
        <SubjectsView />
      </Suspense>
    </PageContainer>
  )
}
