'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FolderOpen } from 'lucide-react'

import {
  NotesGridSkeleton,
  SubjectsGridSkeleton,
} from '@/components/app-skeletons'
import { Badge } from '@/components/ui/badge'
import { BaseButton } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { NoteStatus } from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { useTRPC } from '@/trpc/react'

const statusLabels: Record<NoteStatus, string> = {
  pending: 'Queued',
  processing: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
}

const unassignedSubjectId = 'none'

function NoteCards({
  notes,
}: {
  notes: Array<{
    id: string
    title: string
    status: NoteStatus
    sourceType: 'youtube' | 'transcript'
  }>
}) {
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

function DashboardSubjects() {
  const trpc = useTRPC()
  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())
  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      limit: 50,
    }),
  )

  const subjects = subjectsQuery.data ?? []
  const unassignedCount =
    notesQuery.data?.items.filter((note) => !note.subjectId).length ?? 0

  if (subjectsQuery.isLoading || notesQuery.isLoading) {
    return <SubjectsGridSkeleton />
  }

  if (subjects.length === 0 && unassignedCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <FolderOpen className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            No subjects or notes yet. Create a subject or add your first note.
          </p>
          <div className="flex flex-wrap gap-2">
            <BaseButton asChild>
              <Link
                href="/app/new"
                onClick={() => triggerRouteProgressStart('/app/new')}
              >
                Create note
              </Link>
            </BaseButton>
            <BaseButton asChild variant="outline">
              <Link
                href="/app/subjects"
                onClick={() => triggerRouteProgressStart('/app/subjects')}
              >
                Manage subjects
              </Link>
            </BaseButton>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Choose a subject to browse its notes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => {
          const href = `/app?subjectId=${subject.id}`

          return (
            <Link
              key={subject.id}
              href={href}
              onClick={() => triggerRouteProgressStart(href)}
            >
              <Card className="hover:bg-muted/40 h-full transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.noteCount}{' '}
                    {subject.noteCount === 1 ? 'note' : 'notes'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}

        {unassignedCount > 0 ? (
          <Link
            href={`/app?subjectId=${unassignedSubjectId}`}
            onClick={() =>
              triggerRouteProgressStart(`/app?subjectId=${unassignedSubjectId}`)
            }
          >
            <Card className="hover:bg-muted/40 h-full transition-colors">
              <CardHeader>
                <CardTitle className="text-base">Unassigned</CardTitle>
                <CardDescription>
                  {unassignedCount} {unassignedCount === 1 ? 'note' : 'notes'}{' '}
                  without a subject
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function DashboardSubjectNotes({ subjectId }: { subjectId: string }) {
  const trpc = useTRPC()
  const isUnassigned = subjectId === unassignedSubjectId

  const subjectQuery = useQuery({
    ...trpc.subjects.getById.queryOptions({ subjectId }),
    enabled: !isUnassigned,
  })

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      ...(isUnassigned ? {} : { subjectId }),
      limit: 50,
    }),
  )

  const notes = isUnassigned
    ? (notesQuery.data?.items.filter((note) => !note.subjectId) ?? [])
    : (notesQuery.data?.items ?? [])

  const subjectName = isUnassigned
    ? 'Unassigned'
    : (subjectQuery.data?.name ?? 'Subject')

  const newNoteHref = isUnassigned
    ? '/app/new'
    : `/app/new?subjectId=${subjectId}`

  if ((!isUnassigned && subjectQuery.isLoading) || notesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonBackBar />
        <NotesGridSkeleton count={3} />
      </div>
    )
  }

  if (!isUnassigned && (subjectQuery.isError || !subjectQuery.data)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <p className="text-sm">This subject could not be loaded.</p>
          <BaseButton asChild variant="outline">
            <Link href="/app" onClick={() => triggerRouteProgressStart('/app')}>
              Back to subjects
            </Link>
          </BaseButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <BaseButton asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link href="/app" onClick={() => triggerRouteProgressStart('/app')}>
              <ArrowLeft />
              All subjects
            </Link>
          </BaseButton>
          <div>
            <h2 className="text-lg font-semibold">{subjectName}</h2>
            <p className="text-muted-foreground text-sm">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} — click a
              note to open it.
            </p>
          </div>
        </div>
        <BaseButton asChild>
          <Link
            href={newNoteHref}
            onClick={() => triggerRouteProgressStart(newNoteHref)}
          >
            New note
          </Link>
        </BaseButton>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-8">
            <p className="text-muted-foreground text-sm">
              No notes in this subject yet.
            </p>
            <BaseButton asChild>
              <Link
                href={newNoteHref}
                onClick={() => triggerRouteProgressStart(newNoteHref)}
              >
                Create note
              </Link>
            </BaseButton>
          </CardContent>
        </Card>
      ) : (
        <NoteCards notes={notes} />
      )}
    </div>
  )
}

function SkeletonBackBar() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-56" />
    </div>
  )
}

export function DashboardView() {
  const searchParams = useSearchParams()
  const subjectId = searchParams.get('subjectId')

  if (subjectId) {
    return <DashboardSubjectNotes subjectId={subjectId} />
  }

  return <DashboardSubjects />
}
