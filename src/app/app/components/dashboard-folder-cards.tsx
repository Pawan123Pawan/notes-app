'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
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
import { Button } from '@/components/ui/button'
import {
  Card,
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
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { createFolderInput } from '@/trpc/routers/folders/folders.input'
import { useTRPC } from '@/trpc/react'

export type DashboardFolderItem = {
  id: string
  parentId: string | null
  name: string
  noteCount: number
}

export type FolderCreateState = {
  open: boolean
  parentId: string | null
}

export type DashboardFolderCardsProps = {
  subjectId: string
  /** Folders that are direct children of the current level. */
  folders: DashboardFolderItem[]
  /** Full subject tree, used for child-folder counts. */
  allFolders: DashboardFolderItem[]
  createState: FolderCreateState
  onCreateStateChange: (state: FolderCreateState) => void
}

type FolderNameFormValues = {
  name: string
}

function folderHref(subjectId: string, folderId: string) {
  return `/app?subjectId=${subjectId}&folderId=${folderId}`
}

function childFolderCount(allFolders: DashboardFolderItem[], folderId: string) {
  return allFolders.filter((folder) => folder.parentId === folderId).length
}

export function DashboardFolderCards({
  subjectId,
  folders,
  allFolders,
  createState,
  onCreateStateChange,
}: DashboardFolderCardsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [renameFolder, setRenameFolder] = useState<DashboardFolderItem | null>(
    null,
  )
  const [deleteFolder, setDeleteFolder] = useState<DashboardFolderItem | null>(
    null,
  )

  const renameForm = useForm<FolderNameFormValues>({
    values: { name: renameFolder?.name ?? '' },
  })

  const invalidateFolders = async () => {
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

  const renameMutation = useMutation(
    trpc.folders.update.mutationOptions({
      onSuccess: async () => {
        await invalidateFolders()
        setRenameFolder(null)
        toast.success('Notes folder renamed')
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

  const deleteMutation = useMutation(
    trpc.folders.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateFolders()
        setDeleteFolder(null)
        toast.success('Notes folder deleted')
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

  const openCreate = (parentId: string | null) => {
    onCreateStateChange({ open: true, parentId })
  }

  const handleCreateOpenChange = (open: boolean) => {
    onCreateStateChange({ open, parentId: createState.parentId })
  }

  const submitRename = renameForm.handleSubmit((values) => {
    if (!renameFolder) {
      return
    }

    const name = values.name.trim()
    if (!name) {
      renameForm.setError('name', { message: 'Name is required' })
      return
    }

    if (name === renameFolder.name) {
      setRenameFolder(null)
      return
    }

    renameMutation.mutate({ folderId: renameFolder.id, name })
  })

  return (
    <>
      {folders.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => {
            const href = folderHref(subjectId, folder.id)
            const childrenCount = childFolderCount(allFolders, folder.id)
            const newNoteHref = `/app/new?subjectId=${subjectId}&folderId=${folder.id}`

            return (
              <Card
                key={folder.id}
                className="hover:bg-muted/40 h-full transition-colors"
              >
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={href}
                      className="flex min-w-0 flex-1 items-start gap-2"
                      onClick={() => triggerRouteProgressStart(href)}
                    >
                      <FolderIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <CardTitle className="text-base hover:underline">
                        {folder.name}
                      </CardTitle>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${folder.name} notes folder actions`}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <Link
                              href={newNoteHref}
                              onClick={() =>
                                triggerRouteProgressStart(newNoteHref)
                              }
                            >
                              <PlusIcon />
                              New note
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openCreate(folder.id)}
                          >
                            <PlusIcon />
                            New notes subfolder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setRenameFolder(folder)}
                          >
                            <PencilIcon />
                            Rename
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteFolder(folder)}
                        >
                          <Trash2Icon />
                          Delete notes folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {folder.noteCount}{' '}
                    {folder.noteCount === 1 ? 'note' : 'notes'}
                    {childrenCount > 0
                      ? ` · ${childrenCount} ${childrenCount === 1 ? 'notes subfolder' : 'notes subfolders'}`
                      : null}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      ) : null}

      <Dialog open={createState.open} onOpenChange={handleCreateOpenChange}>
        <DialogContent>
          {createState.open ? (
            <CreateFolderForm
              key={String(createState.parentId)}
              subjectId={subjectId}
              parentId={createState.parentId}
              onCancel={() => handleCreateOpenChange(false)}
              onSuccess={async () => {
                await invalidateFolders()
                onCreateStateChange({
                  open: false,
                  parentId: createState.parentId,
                })
                toast.success('Notes folder created')
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameFolder(null)
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename notes folder</DialogTitle>
              <DialogDescription>
                Update the name of this notes folder.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={renameForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rename-dashboard-folder">
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="rename-dashboard-folder"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      disabled={renameMutation.isPending}
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
                disabled={renameMutation.isPending}
                onClick={() => setRenameFolder(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={renameMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFolder(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notes folder?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteFolder?.name}” and all nested notes folders will be
              deleted. Notes inside them move up to the parent notes folder and
              are not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending || !deleteFolder}
              onClick={() => {
                if (deleteFolder) {
                  deleteMutation.mutate({ folderId: deleteFolder.id })
                }
              }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete notes folder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CreateFolderForm({
  subjectId,
  parentId,
  onCancel,
  onSuccess,
}: {
  subjectId: string
  parentId: string | null
  onCancel: () => void
  onSuccess: () => Promise<void>
}) {
  const trpc = useTRPC()
  const form = useForm<FolderNameFormValues>({
    defaultValues: { name: '' },
  })

  const createMutation = useMutation(
    trpc.folders.create.mutationOptions({
      onSuccess: async () => {
        await onSuccess()
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

  const submitCreate = form.handleSubmit((values) => {
    const input = createFolderInput.safeParse({
      subjectId,
      parentId,
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

    createMutation.mutate(input.data)
  })

  return (
    <form noValidate onSubmit={submitCreate}>
      <DialogHeader>
        <DialogTitle>
          {parentId ? 'New notes subfolder' : 'New notes folder'}
        </DialogTitle>
        <DialogDescription>
          {parentId
            ? 'Create a nested notes folder under the selected notes folder.'
            : 'Create a notes folder in this subject.'}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="py-2">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-dashboard-folder">Name</FieldLabel>
              <Input
                {...field}
                id="create-dashboard-folder"
                aria-invalid={fieldState.invalid}
                autoFocus
                disabled={createMutation.isPending}
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
          disabled={createMutation.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" loading={createMutation.isPending}>
          Create
        </Button>
      </DialogFooter>
    </form>
  )
}
