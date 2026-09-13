'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  CopyIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  folderId?: string
  lastViewedAt?: Date | string | null
}

export type NoteCardSubject = {
  id: string
  name: string
}

export type NoteCardFolder = {
  id: string
  parentId: string | null
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

type MoveNoteFormValues = {
  subjectId: string
  folderId: string
}

function folderDepth(
  folders: NoteCardFolder[],
  folderId: string,
  cache = new Map<string, number>(),
): number {
  const cached = cache.get(folderId)
  if (cached !== undefined) {
    return cached
  }

  const folder = folders.find((item) => item.id === folderId)
  if (!folder?.parentId) {
    cache.set(folderId, 0)
    return 0
  }

  const depth = folderDepth(folders, folder.parentId, cache) + 1
  cache.set(folderId, depth)
  return depth
}

function folderOptionLabel(folders: NoteCardFolder[], folder: NoteCardFolder) {
  const depth = folderDepth(folders, folder.id)
  const indent = depth > 0 ? `${'—'.repeat(depth)} ` : ''
  return `${indent}${folder.name}`
}

export function NoteCard({ note, subjects }: NoteCardProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)

  const noteHref = `/app/notes/${note.id}`

  const titleForm = useForm<{ title: string }>({
    values: { title: note.title },
  })

  const moveForm = useForm<MoveNoteFormValues>({
    values: {
      subjectId: note.subjectId ?? subjects[0]?.id ?? '',
      folderId: note.folderId ?? 'root',
    },
  })

  const moveSubjectId = useWatch({
    control: moveForm.control,
    name: 'subjectId',
  })

  const moveFoldersQuery = useQuery({
    ...trpc.folders.listTree.queryOptions({
      subjectId: moveSubjectId || subjects[0]?.id || 'placeholder',
    }),
    enabled: moveOpen && Boolean(moveSubjectId),
  })

  const moveFolders = moveFoldersQuery.data ?? []

  const invalidateNoteQueries = async (nextSubjectId?: string | null) => {
    const tasks = [
      queryClient.invalidateQueries({
        queryKey: trpc.notes.list.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.subjects.list.queryKey(),
      }),
    ]

    const subjectIds = new Set<string>()
    if (note.subjectId) {
      subjectIds.add(note.subjectId)
    }
    if (nextSubjectId) {
      subjectIds.add(nextSubjectId)
    }

    for (const subjectId of subjectIds) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: trpc.subjects.getById.queryKey({ subjectId }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.folders.listTree.queryKey({ subjectId }),
        }),
      )
    }

    await Promise.all(tasks)
  }

  const updateTitleMutation = useMutation(
    trpc.notes.updateTitle.mutationOptions({
      onSuccess: async () => {
        await invalidateNoteQueries()
        setRenameOpen(false)
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

  const moveMutation = useMutation(
    trpc.notes.updateSubject.mutationOptions({
      onSuccess: async (_data, variables) => {
        await invalidateNoteQueries(variables.subjectId)
        setMoveOpen(false)
        toast.success('Note moved')
      },
      onError: (error) => {
        showErrorToast(
          'Could not move note',
          error,
          'Unable to update the note location.',
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

  const setReadMutation = useMutation(
    trpc.notes.setRead.mutationOptions({
      onSuccess: async (_data, variables) => {
        await invalidateNoteQueries()
        toast.success(variables.read ? 'Marked as read' : 'Marked as unread')
      },
      onError: (error) => {
        showErrorToast(
          'Could not update read status',
          error,
          'Unable to update this note.',
        )
      },
    }),
  )

  const isUnread = note.lastViewedAt == null
  const showReadIndicator = note.status === 'completed' && !isUnread

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

  const openRename = () => {
    titleForm.reset({ title: note.title })
    setRenameOpen(true)
  }

  const openMove = () => {
    moveForm.reset({
      subjectId: note.subjectId ?? subjects[0]?.id ?? '',
      folderId: note.folderId ?? 'root',
    })
    setMoveOpen(true)
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
      setRenameOpen(false)
      return
    }

    updateTitleMutation.mutate(input.data)
  })

  const submitMove = moveForm.handleSubmit((values) => {
    const nextSubjectId = values.subjectId
    const nextFolderId = values.folderId === 'root' ? null : values.folderId

    if (!nextSubjectId) {
      moveForm.setError('subjectId', { message: 'Subject is required' })
      return
    }

    const sameSubject = (note.subjectId ?? null) === nextSubjectId
    const sameFolder = (note.folderId ?? null) === nextFolderId

    if (sameSubject && sameFolder) {
      setMoveOpen(false)
      return
    }

    moveMutation.mutate({
      noteId: note.id,
      subjectId: nextSubjectId,
      folderId: nextFolderId,
    })
  })

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
              {showReadIndicator ? (
                <Badge variant="secondary">
                  <BookOpenCheckIcon />
                  Read
                </Badge>
              ) : null}

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
                    <DropdownMenuItem onClick={openRename}>
                      <PencilIcon />
                      Rename
                    </DropdownMenuItem>

                    {note.status === 'completed' ? (
                      <DropdownMenuItem onClick={copyNotebookHtml}>
                        <CopyIcon />
                        Copy HTML
                      </DropdownMenuItem>
                    ) : null}

                    {note.status === 'completed' ? (
                      <DropdownMenuItem
                        disabled={setReadMutation.isPending}
                        onClick={() =>
                          setReadMutation.mutate({
                            noteId: note.id,
                            read: isUnread,
                          })
                        }
                      >
                        {isUnread ? <BookOpenCheckIcon /> : <BookOpenIcon />}
                        {isUnread ? 'Mark as read' : 'Mark as unread'}
                      </DropdownMenuItem>
                    ) : null}

                    <DropdownMenuItem onClick={openMove}>
                      <FolderOpenIcon />
                      Move…
                    </DropdownMenuItem>
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

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open)
          if (!open) {
            titleForm.reset({ title: note.title })
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitTitle}>
            <DialogHeader>
              <DialogTitle>Rename note</DialogTitle>
              <DialogDescription>
                Update the title shown on this note card.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="title"
                control={titleForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`rename-note-${note.id}`}>
                      Title
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`rename-note-${note.id}`}
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      disabled={updateTitleMutation.isPending}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={updateTitleMutation.isPending}
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={updateTitleMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={moveOpen}
        onOpenChange={(open) => {
          setMoveOpen(open)
          if (!open) {
            moveForm.reset({
              subjectId: note.subjectId ?? subjects[0]?.id ?? '',
              folderId: note.folderId ?? 'root',
            })
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitMove}>
            <DialogHeader>
              <DialogTitle>Move note</DialogTitle>
              <DialogDescription>
                Choose any subject and folder for this note.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="subjectId"
                control={moveForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`move-note-subject-${note.id}`}>
                      Subject
                    </FieldLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value)
                        moveForm.setValue('folderId', 'root')
                        moveForm.clearErrors('subjectId')
                      }}
                      disabled={moveMutation.isPending}
                    >
                      <SelectTrigger
                        id={`move-note-subject-${note.id}`}
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              {moveSubjectId ? (
                <Controller
                  name="folderId"
                  control={moveForm.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={`move-note-folder-${note.id}`}>
                        Folder
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          moveMutation.isPending || moveFoldersQuery.isLoading
                        }
                      >
                        <SelectTrigger
                          id={`move-note-folder-${note.id}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Choose a folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="root">Subject root</SelectItem>
                          {moveFolders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folderOptionLabel(moveFolders, folder)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              ) : null}
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={moveMutation.isPending}
                onClick={() => setMoveOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={moveMutation.isPending}>
                Move
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
