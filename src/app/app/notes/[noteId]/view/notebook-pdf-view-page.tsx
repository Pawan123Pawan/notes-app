'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { BaseButton } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTRPC } from '@/trpc/react'

import { NotebookPdfViewer } from '../notebook-pdf-viewer'

export type NotebookPdfViewPageProps = {
  noteId: string
}

export function NotebookPdfViewPage({ noteId }: NotebookPdfViewPageProps) {
  const trpc = useTRPC()
  const noteQuery = useQuery(trpc.notes.getById.queryOptions({ noteId }))

  const note = noteQuery.data
  const subjectId = note?.subjectId

  const subjectQuery = useQuery({
    ...trpc.subjects.getById.queryOptions({ subjectId: subjectId! }),
    enabled: Boolean(subjectId),
  })

  if (noteQuery.isLoading) {
    return (
      <div className="bg-[#525659] p-4">
        <NoteDetailSkeleton />
      </div>
    )
  }

  if (noteQuery.isError || !note) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 py-8">
            <p className="text-sm">This note could not be loaded.</p>
            <BaseButton asChild variant="outline">
              <Link href="/app">Back to dashboard</Link>
            </BaseButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (note.status !== 'completed' || !note.notebookHtml) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 py-8">
            <p className="text-sm">This notebook is not ready to view yet.</p>
            <BaseButton asChild variant="outline">
              <Link href={`/app/notes/${noteId}`}>Back to note</Link>
            </BaseButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <NotebookPdfViewer
      noteId={noteId}
      title={note.title}
      html={note.notebookHtml}
      subjectId={note.subjectId}
      subjectName={subjectQuery.data?.name}
      variant="standalone"
    />
  )
}
