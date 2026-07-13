import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { SubjectDetailSkeleton } from '@/components/app-skeletons'
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
import { createServerCaller } from '@/trpc/server'

import { SubjectDetailView } from './subject-detail-view'

export const metadata: Metadata = {
  title: 'Subject',
  description: 'View and manage notes in a subject folder.',
}

type SubjectPageProps = {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subjectId } = await params
  const caller = await createServerCaller()

  let subject
  try {
    subject = await caller.subjects.getById({ subjectId })
  } catch {
    notFound()
  }

  return (
    <PageContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app/subjects">Subjects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{subject.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={subject.name}
        description={`${subject.noteCount} ${subject.noteCount === 1 ? 'note' : 'notes'} in this folder.`}
      />

      <Suspense fallback={<SubjectDetailSkeleton />}>
        <SubjectDetailView subjectId={subjectId} />
      </Suspense>
    </PageContainer>
  )
}
