'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  NotesGridSkeleton,
  SubjectDetailSkeleton,
} from '@/components/app-skeletons'
import { SortableNoteCards } from '@/components/sortable-note-cards'
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BaseButton, Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { PageHeader } from '@/components/ui/page-header'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { createFolderInput } from '@/trpc/routers/folders/folders.input'
import { updateSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

import { FolderTree } from './components/folder-tree'

export type SubjectDetailViewProps = {
  subjectId: string
}

type NameFormValues = {
  name: string
}

function folderHref(subjectId: string, folderId: string | null) {
  if (!folderId) {
    return `/app/subjects/${subjectId}`
  }

  return `/app/subjects/${subjectId}?folderId=${folderId}`
}

function folderBreadcrumbPath(
  folders: Array<{ id: string; parentId: string | null; name: string }>,
  folderId: string | null,
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

export function SubjectDetailView({ subjectId }: SubjectDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const folderIdParam = searchParams.get('folderId')

  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const subjectQuery = useQuery(
    trpc.subjects.getById.queryOptions({ subjectId }),
  )

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const foldersQuery = useQuery(
    trpc.folders.listTree.queryOptions({ subjectId }),
  )

  const folders = foldersQuery.data ?? []
  const selectedFolderId =
    folderIdParam && folders.some((folder) => folder.id === folderIdParam)
      ? folderIdParam
      : null
  const selectedFolder = selectedFolderId
    ? (folders.find((folder) => folder.id === selectedFolderId) ?? null)
    : null
  const isInsideFolder = selectedFolder !== null

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId,
      folderId: selectedFolderId,
      limit: 50,
    }),
  )

  const rootNotesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId,
      folderId: null,
      limit: 50,
    }),
  )

  const createFolderForm = useForm<NameFormValues>({
    defaultValues: { name: '' },
  })

  const renameForm = useForm<NameFormValues>({
    values: {
      name: isInsideFolder
        ? (selectedFolder?.name ?? '')
        : (subjectQuery.data?.name ?? ''),
    },
  })

  const invalidateSubjectData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.folders.listTree.queryKey({ subjectId }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.notes.list.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.subjects.getById.queryKey({ subjectId }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.subjects.list.queryKey(),
      }),
    ])
  }

  const createFolderMutation = useMutation(
    trpc.folders.create.mutationOptions({
      onSuccess: async () => {
        await invalidateSubjectData()
        createFolderForm.reset({ name: '' })
        setCreateFolderOpen(false)
        toast.success('Notes folder created')
      },
      onError: (error) => {
        showErrorToast(
          'Could not create notes folder',
          error,
          'Unable to create this notes folder.',
        )
      },
    }),
  )

  const updateSubjectMutation = useMutation(
    trpc.subjects.update.mutationOptions({
      onSuccess: async () => {
        await invalidateSubjectData()
        setRenameOpen(false)
        toast.success('Subject updated')
        router.refresh()
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

  const renameFolderMutation = useMutation(
    trpc.folders.update.mutationOptions({
      onSuccess: async () => {
        await invalidateSubjectData()
        setRenameOpen(false)
        toast.success('Notes folder renamed')
        router.refresh()
      },
      onError: (error) => {
        showErrorToast(
          'Could not rename notes folder',
          error,
          'Unable to rename this notes folder.',
        )
      },
    }),
  )

  const deleteSubjectMutation = useMutation(
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

  const deleteFolderMutation = useMutation(
    trpc.folders.delete.mutationOptions({
      onSuccess: async () => {
        const parentId = selectedFolder?.parentId ?? null
        await invalidateSubjectData()
        setDeleteOpen(false)
        toast.success('Notes folder deleted')
        const href = folderHref(subjectId, parentId)
        triggerRouteProgressStart(href)
        router.push(href)
        router.refresh()
      },
      onError: (error) => {
        showErrorToast(
          'Could not delete notes folder',
          error,
          'Unable to delete this notes folder.',
        )
      },
    }),
  )

  const submitCreateFolder = createFolderForm.handleSubmit((values) => {
    const input = createFolderInput.safeParse({
      subjectId,
      parentId: selectedFolderId,
      name: values.name,
    })

    if (!input.success) {
      for (const issue of input.error.issues) {
        if (issue.path[0] === 'name') {
          createFolderForm.setError('name', { message: issue.message })
        }
      }
      return
    }

    createFolderMutation.mutate(input.data)
  })

  const submitRename = renameForm.handleSubmit((values) => {
    const name = values.name.trim()

    if (!name) {
      renameForm.setError('name', { message: 'Name is required' })
      return
    }

    if (isInsideFolder && selectedFolder) {
      if (name === selectedFolder.name) {
        setRenameOpen(false)
        return
      }

      renameFolderMutation.mutate({ folderId: selectedFolder.id, name })
      return
    }

    const input = updateSubjectInput.safeParse({
      subjectId,
      name,
    })

    if (!input.success) {
      for (const issue of input.error.issues) {
        if (issue.path[0] === 'name') {
          renameForm.setError('name', { message: issue.message })
        }
      }
      return
    }

    if (input.data.name === subjectQuery.data?.name) {
      setRenameOpen(false)
      return
    }

    updateSubjectMutation.mutate(input.data)
  })

  if (subjectQuery.isLoading || foldersQuery.isLoading) {
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
  const folderPath = folderBreadcrumbPath(folders, selectedFolderId)
  const title = selectedFolder?.name ?? subject.name
  const description = selectedFolder
    ? `${selectedFolder.noteCount} ${selectedFolder.noteCount === 1 ? 'note' : 'notes'} in this notes folder.`
    : `${subject.noteCount} ${subject.noteCount === 1 ? 'note' : 'notes'} in this subject.`
  const notesHeading = selectedFolder
    ? `Notes in ${selectedFolder.name}`
    : 'Notes in subject root'

  const newNoteHref = selectedFolderId
    ? `/app/new?subjectId=${subjectId}&folderId=${selectedFolderId}`
    : `/app/new?subjectId=${subjectId}`
  const subjectHref = `/app/subjects/${subjectId}`

  const renamePending =
    updateSubjectMutation.isPending || renameFolderMutation.isPending
  const deletePending =
    deleteSubjectMutation.isPending || deleteFolderMutation.isPending

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          createFolderForm.reset({ name: '' })
          setCreateFolderOpen(true)
        }}
      >
        <PlusIcon />
        New notes folder
      </Button>
      <BaseButton asChild>
        <Link
          href={newNoteHref}
          onClick={() => triggerRouteProgressStart(newNoteHref)}
        >
          New note
        </Link>
      </BaseButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={
              isInsideFolder ? 'Notes folder actions' : 'Subject actions'
            }
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                renameForm.reset({
                  name: isInsideFolder
                    ? (selectedFolder?.name ?? '')
                    : subject.name,
                })
                setRenameOpen(true)
              }}
            >
              <PencilIcon />
              {isInsideFolder ? 'Rename notes folder' : 'Rename subject'}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon />
            {isInsideFolder ? 'Delete notes folder' : 'Delete subject'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/app/subjects"
                    onClick={() => triggerRouteProgressStart('/app/subjects')}
                  >
                    Subjects
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {folderPath.length > 0 ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={subjectHref}
                        onClick={() => triggerRouteProgressStart(subjectHref)}
                      >
                        {subject.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {folderPath.map((folder, index) => {
                    const isLast = index === folderPath.length - 1
                    const href = folderHref(subjectId, folder.id)

                    return (
                      <span key={folder.id} className="contents">
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link
                                href={href}
                                onClick={() => triggerRouteProgressStart(href)}
                              >
                                {folder.name}
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </span>
                    )
                  })}
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{subject.name}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <PageHeader
            title={title}
            description={description}
            extraAction={headerActions}
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(17rem,20rem)_1fr]">
          <Card className="lg:sticky lg:top-4">
            <CardHeader className="border-b">
              <CardTitle>Notes Folders</CardTitle>
              <CardDescription>
                Navigate notes folders in {subject.name}. Counts show notes in
                each folder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FolderTree
                subjectId={subjectId}
                subjectName={subject.name}
                folders={folders}
                selectedFolderId={selectedFolderId}
                rootNoteCount={rootNotesQuery.data?.items.length ?? 0}
                showHeader={false}
              />
            </CardContent>
          </Card>

          <Card size="sm" className="min-w-0 gap-0 py-0">
            <CardHeader className="border-b py-4">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg">{notesHeading}</CardTitle>
                <CardDescription>
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                  {selectedFolderId
                    ? null
                    : ` · ${subject.noteCount} total in subject`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              {notesQuery.isLoading ? (
                <NotesGridSkeleton count={3} />
              ) : notes.length === 0 ? (
                <div className="border-border/70 bg-muted/20 flex flex-col items-start gap-4 rounded-xl border border-dashed px-4 py-8">
                  <p className="text-muted-foreground text-sm">
                    {selectedFolderId
                      ? 'No notes in this folder yet.'
                      : 'No notes at the subject root. Create a note or open a folder.'}
                  </p>
                  <BaseButton asChild>
                    <Link
                      href={newNoteHref}
                      onClick={() => triggerRouteProgressStart(newNoteHref)}
                    >
                      Create note
                    </Link>
                  </BaseButton>
                </div>
              ) : (
                <SortableNoteCards
                  notes={notes}
                  subjects={subjects}
                  subjectId={subjectId}
                  folderId={selectedFolderId}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={createFolderOpen}
        onOpenChange={(open) => {
          setCreateFolderOpen(open)
          if (!open) {
            createFolderForm.reset({ name: '' })
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitCreateFolder}>
            <DialogHeader>
              <DialogTitle>
                {selectedFolderId ? 'New notes subfolder' : 'New notes folder'}
              </DialogTitle>
              <DialogDescription>
                {selectedFolderId
                  ? 'Create a notes folder nested under the current notes folder.'
                  : 'Create a notes folder at the root of this subject.'}
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={createFolderForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="subject-create-folder-name">
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="subject-create-folder-name"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      disabled={createFolderMutation.isPending}
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
                disabled={createFolderMutation.isPending}
                onClick={() => setCreateFolderOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createFolderMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open)
          if (!open) {
            renameForm.reset({
              name: isInsideFolder
                ? (selectedFolder?.name ?? '')
                : subject.name,
            })
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>
                {isInsideFolder ? 'Rename notes folder' : 'Rename subject'}
              </DialogTitle>
              <DialogDescription>
                {isInsideFolder
                  ? 'Update the name shown for this notes folder.'
                  : 'Update the name shown for this subject.'}
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={renameForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rename-entity-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="rename-entity-name"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      disabled={renamePending}
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
                disabled={renamePending}
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={renamePending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isInsideFolder
                ? 'Delete this notes folder?'
                : 'Delete this subject?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isInsideFolder
                ? 'This notes folder and all nested notes folders will be deleted. Notes inside them move up to the parent notes folder (or subject root) and are not deleted.'
                : 'Notes in this subject will be kept but removed from the folder. Nested notes folders will be deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePending}
              onClick={() => {
                if (isInsideFolder && selectedFolder) {
                  deleteFolderMutation.mutate({ folderId: selectedFolder.id })
                  return
                }

                deleteSubjectMutation.mutate({ subjectId })
              }}
            >
              {deletePending
                ? 'Deleting...'
                : isInsideFolder
                  ? 'Delete notes folder'
                  : 'Delete subject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
