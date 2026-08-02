import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { AddSubjectButton } from '@/app/app/subjects/add-subject-button'
import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Subjects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title="Subjects"
          description="Group notes by course, topic, or exam prep."
          extraAction={<AddSubjectButton />}
        />
      </div>

      <Suspense fallback={<SubjectsGridSkeleton />}>
        <SubjectsView />
      </Suspense>
    </PageContainer>
  )
}
