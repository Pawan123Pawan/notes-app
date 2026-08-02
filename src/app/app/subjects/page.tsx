import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AddSubjectButton } from '@/app/app/subjects/add-subject-button'
import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

import { SubjectsView } from './subjects-view'

export const metadata: Metadata = {
  title: 'Subjects',
  description: 'Organize your study notes into subjects and folders.',
}

export default function SubjectsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Subjects"
        description="Group notes by course, topic, or exam prep."
        extraAction={<AddSubjectButton />}
      />
      <Suspense fallback={<SubjectsGridSkeleton />}>
        <SubjectsView />
      </Suspense>
    </PageContainer>
  )
}
