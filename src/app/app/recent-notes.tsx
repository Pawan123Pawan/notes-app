'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { NotesGridSkeleton } from '@/components/app-skeletons'
import { Badge } from '@/components/ui/badge'
import { BaseButton } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NoteStatus } from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { useTRPC } from '@/trpc/react'

const statusLabels: Record<NoteStatus, string> = {
  pending: 'Queued',
  processing: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
}

export function RecentNotes() {
  const trpc = useTRPC()

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      limit: 12,
    }),
  )

  const notes = notesQuery.data?.items ?? []

  if (notesQuery.isLoading) {
    return <NotesGridSkeleton />
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <p className="text-muted-foreground text-sm">
            No notes yet. Upload a transcript or paste a YouTube URL to create
            your first notebook.
          </p>
          <BaseButton asChild>
            <Link
              href="/app/new"
              onClick={() => triggerRouteProgressStart('/app/new')}
            >
              Create your first note
            </Link>
          </BaseButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/app/notes/${note.id}`}
          onClick={() => triggerRouteProgressStart(`/app/notes/${note.id}`)}
        >
          <Card className="hover:bg-muted/40 h-full transition-colors">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="line-clamp-2 text-base">
                  {note.title}
                </CardTitle>
                <Badge variant="secondary">{statusLabels[note.status]}</Badge>
              </div>
              <p className="text-muted-foreground text-sm capitalize">
                {note.sourceType === 'youtube' ? 'YouTube' : 'Transcript'}
              </p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
