'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { BaseButton } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { NoteStatus } from '@/db/schema/note.constants'
import { useTRPC } from '@/trpc/react'

import { NotebookPdfViewer } from './notebook-pdf-viewer'

export type NoteDetailViewProps = {
  noteId: string
}

function isProcessingStatus(status: NoteStatus) {
  return status === 'pending' || status === 'processing'
}

export function NoteDetailView({ noteId }: NoteDetailViewProps) {
  const trpc = useTRPC()

  const noteQuery = useQuery({
    ...trpc.notes.getById.queryOptions({ noteId }),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isProcessingStatus(status) ? 2000 : false
    },
  })

  const note = noteQuery.data
  const subjectId = note?.subjectId

  const subjectQuery = useQuery({
    ...trpc.subjects.getById.queryOptions({ subjectId: subjectId! }),
    enabled: Boolean(subjectId),
  })

  if (noteQuery.isLoading) {
    return <NoteDetailSkeleton />
  }

  if (noteQuery.isError || !note) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 py-8">
          <p className="text-sm">This note could not be loaded.</p>
          <BaseButton asChild variant="outline">
            <Link href="/app">Back to dashboard</Link>
          </BaseButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-screen flex-col gap-4">
      {isProcessingStatus(note.status) ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Spinner />
            <div>
              <p className="font-medium">Creating your notebook</p>
              <p className="text-muted-foreground text-sm">
                Generating detailed Hindi notes and colorful A4 notebook pages.
                This can take a few minutes for better quality.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {note.status === 'failed' ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col gap-3 py-6">
            <p className="text-destructive font-medium">Processing failed</p>
            <p className="text-muted-foreground text-sm">
              {note.errorMessage ??
                'Something went wrong while generating this note.'}
            </p>
            <BaseButton asChild variant="outline">
              <Link href="/app/new">Try again</Link>
            </BaseButton>
          </CardContent>
        </Card>
      ) : null}

      {note.status === 'completed' && note.notebookHtml ? (
        <NotebookPdfViewer
          noteId={noteId}
          title={note.title}
          html={note.notebookHtml}
          subjectId={note.subjectId}
          subjectName={subjectQuery.data?.name}
        />
      ) : null}

      {note.status === 'completed' && !note.notebookHtml ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-sm">
            This note has no notebook content yet.
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
