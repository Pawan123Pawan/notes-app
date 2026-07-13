import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

import { NewNoteForm } from './new-note-form'

export const metadata: Metadata = {
  title: 'New note',
  description:
    'Paste a transcript or add a YouTube URL to generate structured study notes and a handwritten notebook.',
}

export default function NewNotePage() {
  return (
    <PageContainer>
      <PageHeader
        title="New note"
        description="Turn a transcript into structured study notes and a handwritten notebook."
      />
      <Suspense>
        <NewNoteForm />
      </Suspense>
    </PageContainer>
  )
}
