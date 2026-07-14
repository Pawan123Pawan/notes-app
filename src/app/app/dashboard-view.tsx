'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Copy,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  NotesGridSkeleton,
  SubjectsGridSkeleton,
} from '@/components/app-skeletons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  noteSourceTypeLabels,
  type NoteStatus,
} from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/react'

const statusLabels: Record<NoteStatus, string> = {
  pending: 'Queued',
  processing: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
}

const statusVariants: Record<
  NoteStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  processing: 'default',
  completed: 'outline',
  failed: 'destructive',
}

const unassignedSubjectId = 'none'

type DashboardNote = {
  id: string
  title: string
  status: NoteStatus
  sourceType: keyof typeof noteSourceTypeLabels
  subjectId?: string
}

type DashboardSubject = {
  id: string
  name: string
}

function NoteCard({
  note,
  subjects,
}: {
  note: DashboardNote
  subjects: DashboardSubject[]
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const noteHref = `/app/notes/${note.id}`

  const updateSubjectMutation = useMutation(
    trpc.notes.updateSubject.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.notes.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.list.queryKey(),
          }),
        ])
        toast.success('Subject updated')
      },
      onError: (error) => {
        showErrorToast(
          'Could not move note',
          error,
          'Unable to update the subject.',
        )
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.notes.delete.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.notes.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.list.queryKey(),
          }),
        ])
        toast.success('Note deleted')
      },
      onError: (error) => {
        showErrorToast(
          'Could not delete note',
          error,
          'Unable to delete this note.',
        )
      },
    }),
  )

  const copyNotebookHtml = async () => {
    try {
      const detail = await queryClient.fetchQuery(
        trpc.notes.getById.queryOptions({ noteId: note.id }),
      )
      if (!detail.notebookHtml) {
        toast.error('This note has no notebook HTML yet')
        return
      }
      await navigator.clipboard.writeText(detail.notebookHtml)
      toast.success('Notebook HTML copied')
    } catch {
      toast.error('Could not copy HTML')
    }
  }

  return (
    <>
      <Card className="hover:bg-muted/40 h-full transition-colors">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={noteHref}
              className="min-w-0 flex-1"
              onClick={() => triggerRouteProgressStart(noteHref)}
            >
              <CardTitle className="line-clamp-2 text-base hover:underline">
                {note.title}
              </CardTitle>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={statusVariants[note.status]}>
                {statusLabels[note.status]}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Note actions"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuGroup>
                    {note.status === 'completed' ? (
                      <DropdownMenuItem onClick={copyNotebookHtml}>
                        <Copy />
                        Copy HTML
                      </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderOpen />
                        Move to subject
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="min-w-44">
                        <DropdownMenuRadioGroup
                          value={note.subjectId ?? 'none'}
                          onValueChange={(value) => {
                            updateSubjectMutation.mutate({
                              noteId: note.id,
                              subjectId: value === 'none' ? null : value,
                            })
                          }}
                        >
                          <DropdownMenuRadioItem
                            value="none"
                            disabled={updateSubjectMutation.isPending}
                          >
                            No subject
                          </DropdownMenuRadioItem>
                          {subjects.map((subject) => (
                            <DropdownMenuRadioItem
                              key={subject.id}
                              value={subject.id}
                              disabled={updateSubjectMutation.isPending}
                            >
                              {subject.name}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 />
                    Delete note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {noteSourceTypeLabels[note.sourceType]}
          </p>
        </CardHeader>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the note and notebook. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ noteId: note.id })}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete note'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function NoteCards({
  notes,
  subjects,
}: {
  notes: DashboardNote[]
  subjects: DashboardSubject[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} subjects={subjects} />
      ))}
    </div>
  )
}

function SubjectCard({
  subject,
}: {
  subject: { id: string; name: string; noteCount: number }
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const notesHref = `/app?subjectId=${subject.id}`
  const manageHref = `/app/subjects/${subject.id}`
  const newNoteHref = `/app/new?subjectId=${subject.id}`

  const deleteMutation = useMutation(
    trpc.subjects.delete.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.notes.list.queryKey(),
          }),
        ])
        toast.success('Subject deleted')
      },
      onError: (error) => {
        showErrorToast(
          'Could not delete subject',
          error,
          'Unable to delete this subject.',
        )
      },
    }),
  )

  return (
    <>
      <Card className="hover:bg-muted/40 h-full transition-colors">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={notesHref}
              className="min-w-0 flex-1"
              onClick={() => triggerRouteProgressStart(notesHref)}
            >
              <CardTitle className="text-base hover:underline">
                {subject.name}
              </CardTitle>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Subject actions"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href={newNoteHref}
                      onClick={() => triggerRouteProgressStart(newNoteHref)}
                    >
                      <Plus />
                      New note
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={manageHref}
                      onClick={() => triggerRouteProgressStart(manageHref)}
                    >
                      <Settings2 />
                      Manage subject
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 />
                  Delete subject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>
            {subject.noteCount} {subject.noteCount === 1 ? 'note' : 'notes'}
          </CardDescription>
        </CardHeader>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              Notes in this subject will be kept but removed from the folder.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ subjectId: subject.id })}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete subject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}

        {unassignedCount > 0 ? (
          <Card className="hover:bg-muted/40 h-full transition-colors">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/app?subjectId=${unassignedSubjectId}`}
                  className="min-w-0 flex-1"
                  onClick={() =>
                    triggerRouteProgressStart(
                      `/app?subjectId=${unassignedSubjectId}`,
                    )
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
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/app/new"
                        onClick={() => triggerRouteProgressStart('/app/new')}
                      >
                        <Plus />
                        New note
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                {unassignedCount} {unassignedCount === 1 ? 'note' : 'notes'}{' '}
                without a subject
              </CardDescription>
            </CardHeader>
          </Card>
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

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      ...(isUnassigned ? {} : { subjectId }),
      limit: 50,
    }),
  )

  const notes = isUnassigned
    ? (notesQuery.data?.items.filter((note) => !note.subjectId) ?? [])
    : (notesQuery.data?.items ?? [])

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
        <NoteCards notes={notes} subjects={subjects} />
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
