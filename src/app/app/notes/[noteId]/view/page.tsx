import type { Metadata } from 'next'
import { Suspense } from 'react'

import { NoteDetailSkeleton } from '@/components/app-skeletons'

import { NotebookPdfViewPage } from './notebook-pdf-view-page'

export const metadata: Metadata = {
  title: 'Notebook',
  description: 'Fullscreen handwritten A4 study notebook.',
}

type NotebookPdfViewRouteProps = {
  params: Promise<{ noteId: string }>
}

export default async function NotebookPdfViewRoute({
  params,
}: NotebookPdfViewRouteProps) {
  const { noteId } = await params

  return (
    <Suspense
      fallback={
        <div className="bg-[#525659] p-4">
          <NoteDetailSkeleton />
        </div>
      }
    >
      <NotebookPdfViewPage noteId={noteId} />
    </Suspense>
  )
}
