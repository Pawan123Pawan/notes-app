import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PageContainer } from '@/components/ui/page-container'

import { NoteDetailView } from './note-detail-view'

export const metadata: Metadata = {
  title: 'Note',
  description: 'View structured study notes and your handwritten notebook.',
}

type NotePageProps = {
  params: Promise<{ noteId: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { noteId } = await params

  return (
    <PageContainer>
      <Suspense>
        <NoteDetailView noteId={noteId} />
      </Suspense>
    </PageContainer>
  )
}
