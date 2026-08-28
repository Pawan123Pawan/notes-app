'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { BaseButton, Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { NoteStatus } from '@/db/schema/note.constants'
import { useTRPC } from '@/trpc/react'

import { NotebookPdfViewer } from './notebook-pdf-viewer'

export type NoteDetailViewProps = {
  noteId: string
}

function isProcessingStatus(status: NoteStatus) {
  return status === 'pending' || status === 'processing'
}

function buildFolderPath(
  folders: Array<{ id: string; parentId: string | null; name: string }>,
  folderId: string | undefined,
) {
  if (!folderId) {
    return []
  }

  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const path: Array<{ id: string; name: string }> = []
  let current = byId.get(folderId)

  while (current) {
    path.unshift({ id: current.id, name: current.name })
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  return path
}

export function NoteDetailView({ noteId }: NoteDetailViewProps) {
  const trpc = useTRPC()

  const noteQuery = useQuery(trpc.notes.getById.queryOptions({ noteId }))

  const note = noteQuery.data
  const subjectId = note?.subjectId

  const subjectQuery = useQuery({
    ...trpc.subjects.getById.queryOptions({ subjectId: subjectId! }),
    enabled: Boolean(subjectId),
  })

  const foldersQuery = useQuery({
    ...trpc.folders.listTree.queryOptions({ subjectId: subjectId! }),
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

  const folderPath = buildFolderPath(foldersQuery.data ?? [], note.folderId)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isProcessingStatus(note.status) ? (
        <Card className="m-4">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-muted-foreground text-sm">
              This note is still generating. Check again when ready.
            </p>
            <Button
              type="button"
              variant="outline"
              loading={noteQuery.isFetching && !noteQuery.isLoading}
              onClick={() => void noteQuery.refetch()}
            >
              Check again
            </Button>
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
          title={note.title}
          html={note.notebookHtml}
          subjectId={note.subjectId}
          subjectName={subjectQuery.data?.name}
          folderPath={folderPath}
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
