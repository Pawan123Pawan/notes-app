'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from 'lucide-react'

import {
  NotesGridSkeleton,
  SubjectsGridSkeleton,
} from '@/components/app-skeletons'
import { SortableNoteCards } from '@/components/sortable-note-cards'
import { SortableSubjectCards } from '@/components/sortable-subject-cards'
import { BaseButton, Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { useTRPC } from '@/trpc/react'

const unassignedSubjectId = 'none'

function UnassignedSubjectCard({ noteCount }: { noteCount: number }) {
  return (
    <Card className="hover:bg-muted/40 h-full transition-colors">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/app?subjectId=${unassignedSubjectId}`}
            className="min-w-0 flex-1"
            onClick={() =>
              triggerRouteProgressStart(`/app?subjectId=${unassignedSubjectId}`)
            }
          >
            <CardTitle className="text-base hover:underline">
              Unassigned
            </CardTitle>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Unassigned notes actions"
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/app/new"
                  onClick={() => triggerRouteProgressStart('/app/new')}
                >
                  <PlusIcon />
                  New note
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          {noteCount} {noteCount === 1 ? 'note' : 'notes'} without a subject
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function DashboardSubjects() {
  const trpc = useTRPC()
  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())
  const unassignedNotesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId: null,
      limit: 50,
    }),
  )

  const subjects = subjectsQuery.data ?? []
  const unassignedCount = unassignedNotesQuery.data?.items.length ?? 0

  if (subjectsQuery.isLoading || unassignedNotesQuery.isLoading) {
    return <SubjectsGridSkeleton />
  }

  if (subjects.length === 0 && unassignedCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <FolderOpenIcon className="text-muted-foreground size-8" />
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
        Choose a subject to browse its notes. Drag a card to reorder subjects.
      </p>
      <SortableSubjectCards
        subjects={subjects}
        titleHref="notes"
        unassignedSlot={
          unassignedCount > 0 ? (
            <UnassignedSubjectCard noteCount={unassignedCount} />
          ) : null
        }
      />
    </div>
  )
}

function DashboardSubjectNotes({ subjectId }: { subjectId: string }) {
  const trpc = useTRPC()
  const isUnassigned = subjectId === unassignedSubjectId
  const listSubjectId = isUnassigned ? null : subjectId

  const subjectQuery = useQuery({
    ...trpc.subjects.getById.queryOptions({ subjectId }),
    enabled: !isUnassigned,
  })

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId: listSubjectId,
      limit: 50,
    }),
  )

  const notes = notesQuery.data?.items ?? []
  const subjects = subjectsQuery.data ?? []

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
              <ArrowLeftIcon />
              All subjects
            </Link>
          </BaseButton>
          <div>
            <h2 className="text-lg font-semibold">{subjectName}</h2>
            <p className="text-muted-foreground text-sm">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} — drag a
              card to reorder.
              {!isUnassigned ? (
                <>
                  {' '}
                  Use{' '}
                  <Link
                    href={`/app/subjects/${subjectId}`}
                    className="text-foreground underline underline-offset-2"
                    onClick={() =>
                      triggerRouteProgressStart(`/app/subjects/${subjectId}`)
                    }
                  >
                    folders
                  </Link>{' '}
                  to organize notes inside this subject.
                </>
              ) : null}
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
        <SortableNoteCards
          notes={notes}
          subjects={subjects}
          subjectId={listSubjectId}
        />
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
