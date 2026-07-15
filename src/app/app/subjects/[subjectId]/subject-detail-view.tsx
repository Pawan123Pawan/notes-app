'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CopyIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  NotesGridSkeleton,
  SubjectDetailSkeleton,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { BaseButton, Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  noteSourceTypeLabels,
  type NoteStatus,
} from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { updateNoteTitleInput } from '@/trpc/routers/notes/notes.input'
import { updateSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

export type SubjectDetailViewProps = {
  subjectId: string
}

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

type RenameSubjectFormValues = {
  name: string
}

type SubjectNote = {
  id: string
  title: string
  status: NoteStatus
  sourceType: keyof typeof noteSourceTypeLabels
  subjectId?: string
}

type SubjectOption = {
  id: string
  name: string
}

function NoteCard({
  note,
  subjects,
  currentSubjectId,
}: {
  note: SubjectNote
  subjects: SubjectOption[]
  currentSubjectId: string
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const skipTitleBlurSaveRef = useRef(false)

  const noteHref = `/app/notes/${note.id}`

  const titleForm = useForm<{ title: string }>({
    values: { title: note.title },
  })

  const invalidateNoteQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.notes.list.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.subjects.list.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.subjects.getById.queryKey({
          subjectId: currentSubjectId,
        }),
      }),
    ])
  }

  const updateTitleMutation = useMutation(
    trpc.notes.updateTitle.mutationOptions({
      onSuccess: async () => {
        await invalidateNoteQueries()
        setIsEditingTitle(false)
        toast.success('Title updated')
      },
      onError: (error) => {
        showErrorToast(
          'Could not rename note',
          error,
          'Unable to update the title.',
        )
      },
    }),
  )

  const updateSubjectMutation = useMutation(
    trpc.notes.updateSubject.mutationOptions({
      onSuccess: async () => {
        await invalidateNoteQueries()
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
        await invalidateNoteQueries()
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

  const startEditingTitle = () => {
    titleForm.reset({ title: note.title })
    setIsEditingTitle(true)
  }

  const cancelEditingTitle = () => {
    skipTitleBlurSaveRef.current = true
    titleForm.reset({ title: note.title })
    setIsEditingTitle(false)
  }

  const submitTitle = titleForm.handleSubmit((values) => {
    const input = updateNoteTitleInput.safeParse({
      noteId: note.id,
      title: values.title,
    })

    if (!input.success) {
      for (const issue of input.error.issues) {
        if (issue.path[0] === 'title') {
          titleForm.setError('title', { message: issue.message })
        }
      }
      return
    }

    if (input.data.title === note.title) {
      setIsEditingTitle(false)
      return
    }

    updateTitleMutation.mutate(input.data)
  })

  return (
    <>
      <Card className="hover:bg-muted/40 h-full transition-colors">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            {isEditingTitle ? (
              <form
                noValidate
                className="min-w-0 flex-1"
                onSubmit={submitTitle}
              >
                <Controller
                  name="title"
                  control={titleForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Input
                        {...field}
                        aria-label="Note title"
                        aria-invalid={fieldState.invalid}
                        autoFocus
                        disabled={updateTitleMutation.isPending}
                        onBlur={() => {
                          field.onBlur()
                          if (skipTitleBlurSaveRef.current) {
                            skipTitleBlurSaveRef.current = false
                            return
                          }
                          void submitTitle()
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            cancelEditingTitle()
                          }
                        }}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </form>
            ) : (
              <Link
                href={noteHref}
                className="min-w-0 flex-1"
                onClick={() => triggerRouteProgressStart(noteHref)}
              >
                <CardTitle className="line-clamp-2 text-base hover:underline">
                  {note.title}
                </CardTitle>
              </Link>
            )}
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
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={startEditingTitle}>
                      <PencilIcon />
                      Rename
                    </DropdownMenuItem>

                    {note.status === 'completed' ? (
                      <DropdownMenuItem onClick={copyNotebookHtml}>
                        <CopyIcon />
                        Copy HTML
                      </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderOpenIcon />
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
                    <Trash2Icon />
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

export function SubjectDetailView({ subjectId }: SubjectDetailViewProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const subjectQuery = useQuery(
    trpc.subjects.getById.queryOptions({ subjectId }),
  )

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId,
      limit: 50,
    }),
  )

  const form = useForm<RenameSubjectFormValues>({
    values: {
      name: subjectQuery.data?.name ?? '',
    },
  })

  const updateMutation = useMutation(
    trpc.subjects.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.getById.queryKey({ subjectId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.list.queryKey(),
          }),
        ])
        toast.success('Subject updated')
      },
      onError: (error) => {
        showErrorToast(
          'Could not update subject',
          error,
          'Unable to update this subject.',
        )
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.subjects.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.subjects.list.queryKey(),
        })
        const href = '/app/subjects'
        triggerRouteProgressStart(href)
        router.push(href)
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

  const submitRename = form.handleSubmit((values) => {
    const input = updateSubjectInput.safeParse({
      subjectId,
      name: values.name,
    })

    if (!input.success) {
      for (const issue of input.error.issues) {
        if (issue.path[0] === 'name') {
          form.setError('name', { message: issue.message })
        }
      }

      return
    }

    updateMutation.mutate(input.data)
  })

  if (subjectQuery.isLoading) {
    return <SubjectDetailSkeleton />
  }

  if (subjectQuery.isError || !subjectQuery.data) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <p className="text-sm">This subject could not be loaded.</p>
          <BaseButton asChild variant="outline">
            <Link href="/app/subjects">Back to subjects</Link>
          </BaseButton>
        </CardContent>
      </Card>
    )
  }

  const subject = subjectQuery.data
  const notes = notesQuery.data?.items ?? []
  const subjects = subjectsQuery.data ?? []

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Subject settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form noValidate onSubmit={submitRename}>
            <FieldGroup className="sm:flex-row sm:items-end">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex-1">
                    <FieldLabel htmlFor="rename-subject">Name</FieldLabel>
                    <Input
                      {...field}
                      id="rename-subject"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
              <Button type="submit" loading={updateMutation.isPending}>
                Save
              </Button>
            </FieldGroup>
          </form>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">
                <Trash2Icon />
                Delete subject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
                <AlertDialogDescription>
                  Notes in this subject will be kept but removed from the
                  folder. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ subjectId })}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete subject'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Notes in this subject</h2>
          <p className="text-muted-foreground text-sm">
            {subject.noteCount} {subject.noteCount === 1 ? 'note' : 'notes'}
          </p>
        </div>

        {notesQuery.isLoading ? (
          <NotesGridSkeleton count={3} />
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 py-8">
              <p className="text-muted-foreground text-sm">
                No notes in this subject yet. Create a note and assign it here.
              </p>
              <BaseButton asChild>
                <Link
                  href={`/app/new?subjectId=${subjectId}`}
                  onClick={() =>
                    triggerRouteProgressStart(`/app/new?subjectId=${subjectId}`)
                  }
                >
                  Create note in this subject
                </Link>
              </BaseButton>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                subjects={subjects}
                currentSubjectId={subjectId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
