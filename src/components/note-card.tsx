'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  noteSourceTypeLabels,
  type NoteStatus,
} from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { updateNoteTitleInput } from '@/trpc/routers/notes/notes.input'
import { useTRPC } from '@/trpc/react'

export type NoteCardNote = {
  id: string
  title: string
  status: NoteStatus
  sourceType: keyof typeof noteSourceTypeLabels
  subjectId?: string
}

export type NoteCardSubject = {
  id: string
  name: string
}

export type NoteCardProps = {
  note: NoteCardNote
  subjects: NoteCardSubject[]
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

export function NoteCard({ note, subjects }: NoteCardProps) {
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
    const tasks = [
      queryClient.invalidateQueries({
        queryKey: trpc.notes.list.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.subjects.list.queryKey(),
      }),
    ]

    if (note.subjectId) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: trpc.subjects.getById.queryKey({
            subjectId: note.subjectId,
          }),
        }),
      )
    }

    await Promise.all(tasks)
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
