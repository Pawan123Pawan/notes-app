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
  description: 'View and manage notes and folders in a subject.',
}

type SubjectPageProps = {
  params: Promise<{ subjectId: string }>
  searchParams: Promise<{ folderId?: string }>
}

export default async function SubjectPage({
  params,
  searchParams,
}: SubjectPageProps) {
  const { subjectId } = await params
  const { folderId } = await searchParams
  const caller = await createServerCaller()

  let subject
  try {
    subject = await caller.subjects.getById({ subjectId })
  } catch {
    notFound()
  }

  const folders = await caller.folders.listTree({ subjectId })
  const folderById = new Map(folders.map((folder) => [folder.id, folder]))
  const selectedFolder =
    folderId && folderById.has(folderId) ? folderById.get(folderId) : undefined

  const folderPath: { id: string; name: string }[] = []
  if (selectedFolder) {
    let current: (typeof folders)[number] | undefined = selectedFolder
    const chain: { id: string; name: string }[] = []

    while (current) {
      chain.unshift({ id: current.id, name: current.name })
      current = current.parentId ? folderById.get(current.parentId) : undefined
    }

    folderPath.push(...chain)
  }

  const description = selectedFolder
    ? `${selectedFolder.noteCount} ${selectedFolder.noteCount === 1 ? 'note' : 'notes'} in this folder.`
    : `${subject.noteCount} ${subject.noteCount === 1 ? 'note' : 'notes'} in this subject.`

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
          {folderPath.length > 0 ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/app/subjects/${subjectId}`}>
                    {subject.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {folderPath.map((folder, index) => {
                const isLast = index === folderPath.length - 1
                const href = `/app/subjects/${subjectId}?folderId=${folder.id}`

                return (
                  <span key={folder.id} className="contents">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{folder.name}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                )
              })}
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>{subject.name}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={selectedFolder?.name ?? subject.name}
        description={description}
      />

      <Suspense fallback={<SubjectDetailSkeleton />}>
        <SubjectDetailView subjectId={subjectId} />
      </Suspense>
    </PageContainer>
  )
}
