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
    <PageContainer className="flex h-dvh max-h-dvh flex-1 flex-col gap-0 overflow-hidden p-0 sm:gap-0 sm:px-0 md:h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-1rem)]">
      <Suspense fallback={<NoteDetailSkeleton />}>
        <NoteDetailView noteId={noteId} />
      </Suspense>
    </PageContainer>
  )
}
