import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { NoteDetailSkeleton } from '@/components/app-skeletons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageContainer } from '@/components/ui/page-container'
import { createServerCaller } from '@/trpc/server'

import { NoteDetailView } from './note-detail-view'

export const metadata: Metadata = {
  title: 'Note',
  description: 'View your handwritten A4 study notebook.',
}

type NotePageProps = {
  params: Promise<{ noteId: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { noteId } = await params
  const caller = await createServerCaller()

  let note
  try {
    note = await caller.notes.getById({ noteId })
  } catch {
    notFound()
  }

  let subjectName: string | undefined
  if (note.subjectId) {
    try {
      const subject = await caller.subjects.getById({
        subjectId: note.subjectId,
      })
      subjectName = subject.name
    } catch {
      subjectName = undefined
    }
  }

  return (
    <PageContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {note.subjectId && subjectName ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/app/subjects/${note.subjectId}`}>
                    {subjectName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{note.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Suspense fallback={<NoteDetailSkeleton />}>
        <NoteDetailView noteId={noteId} />
      </Suspense>
    </PageContainer>
  )
}
