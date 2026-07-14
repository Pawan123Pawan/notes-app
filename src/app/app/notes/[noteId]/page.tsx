import type { Metadata } from 'next'
import { Suspense } from 'react'

import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

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

  return (
    <PageContainer>
      <Suspense fallback={<NoteDetailSkeleton />}>
        <NoteDetailView noteId={noteId} />
      </Suspense>
    </PageContainer>
  )
}
