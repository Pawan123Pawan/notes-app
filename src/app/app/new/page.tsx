import type { Metadata } from 'next'
import { Suspense } from 'react'

import { NewNoteFormSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

import { NewNoteForm } from './new-note-form'

export const metadata: Metadata = {
  title: 'New note',
  description:
    'Upload a transcript, add a YouTube URL, or import an HTML notebook file to save study notes.',
}

export default function NewNotePage() {
  return (
    <PageContainer>
      <PageHeader
        title="New note"
        description="Upload a transcript, paste a YouTube URL, or import an HTML notebook file."
      />
      <Suspense fallback={<NewNoteFormSkeleton />}>
        <NewNoteForm />
      </Suspense>
    </PageContainer>
  )
}
