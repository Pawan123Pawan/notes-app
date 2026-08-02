'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
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
import { cn, showErrorToast } from '@/lib/utils'
import { createFolderInput } from '@/trpc/routers/folders/folders.input'
import { useTRPC } from '@/trpc/react'

export type FolderTreeItem = {
  id: string
  parentId: string | null
  name: string
  sortOrder: number
  noteCount: number
}

export type FolderTreeProps = {
  subjectId: string
  folders: FolderTreeItem[]
  selectedFolderId: string | null
  rootNoteCount: number
}

type FolderNameFormValues = {
  name: string
}

type TreeNode = FolderTreeItem & {
  children: TreeNode[]
}

function buildTree(folders: FolderTreeItem[]): TreeNode[] {
  const byParent = new Map<string | null, FolderTreeItem[]>()

  for (const folder of folders) {
    const key = folder.parentId
    const list = byParent.get(key) ?? []
    list.push(folder)
    byParent.set(key, list)
  }

  for (const list of byParent.values()) {
    list.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    )
  }

  function childrenOf(parentId: string | null): TreeNode[] {
    return (byParent.get(parentId) ?? []).map((folder) => ({
      ...folder,
      children: childrenOf(folder.id),
    }))
  }

  return childrenOf(null)
}

function ancestorIds(
  folders: FolderTreeItem[],
  folderId: string | null,
): string[] {
  if (!folderId) {
    return []
  }

  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const ids: string[] = []
  let current = byId.get(folderId)

  while (current?.parentId) {
    ids.push(current.parentId)
    current = byId.get(current.parentId)
  }

  return ids
}

function folderHref(subjectId: string, folderId: string | null) {
  if (!folderId) {
    return `/app/subjects/${subjectId}`
  }

  return `/app/subjects/${subjectId}?folderId=${folderId}`
}

export function FolderTree({
  subjectId,
  folders,
  selectedFolderId,
  rootNoteCount,
}: FolderTreeProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const tree = buildTree(folders)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ancestorIds(folders, selectedFolderId)),
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [renameFolder, setRenameFolder] = useState<FolderTreeItem | null>(null)
  const [deleteFolder, setDeleteFolder] = useState<FolderTreeItem | null>(null)

  const createForm = useForm<FolderNameFormValues>({
    defaultValues: { name: '' },
  })

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
    ])
  }

  const createMutation = useMutation(
    trpc.folders.create.mutationOptions({
      onSuccess: async () => {
        await invalidateFolders()
        createForm.reset({ name: '' })
        setCreateOpen(false)
        toast.success('Folder created')
      },
      onError: (error) => {
        showErrorToast(
          'Could not create folder',
          error,
          'Unable to create this folder.',
        )
      },
    }),
  )

  const renameMutation = useMutation(
    trpc.folders.update.mutationOptions({
      onSuccess: async () => {
        await invalidateFolders()
        setRenameFolder(null)
        toast.success('Folder renamed')
      },
      onError: (error) => {
        showErrorToast(
          'Could not rename folder',
          error,
          'Unable to rename this folder.',
        )
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.folders.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateFolders()
        setDeleteFolder(null)
        toast.success('Folder deleted')
      },
      onError: (error) => {
        showErrorToast(
          'Could not delete folder',
          error,
          'Unable to delete this folder.',
        )
      },
    }),
  )

  const openCreate = (parentId: string | null) => {
    setCreateParentId(parentId)
    createForm.reset({ name: '' })
    setCreateOpen(true)
  }

  const submitCreate = createForm.handleSubmit((values) => {
    const input = createFolderInput.safeParse({
      subjectId,
      parentId: createParentId,
      name: values.name,
    })

    if (!input.success) {
      for (const issue of input.error.issues) {
        if (issue.path[0] === 'name') {
          createForm.setError('name', { message: issue.message })
        }
      }
      return
    }

    createMutation.mutate(input.data)
  })

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

  const toggleExpanded = (folderId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const renderNode = (node: TreeNode, depth: number) => {
    const isSelected = selectedFolderId === node.id
    const isExpanded = expandedIds.has(node.id)
    const hasChildren = node.children.length > 0
    const href = folderHref(subjectId, node.id)

    return (
      <li key={node.id}>
        <div
          className={cn(
            'group flex items-center gap-0.5 rounded-md pr-1',
            isSelected && 'bg-muted',
          )}
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            disabled={!hasChildren}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(node.id)
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )
            ) : (
              <span className="size-4" />
            )}
          </button>

          <Link
            href={href}
            className="hover:bg-muted/80 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-sm"
          >
            {isSelected ? (
              <FolderOpenIcon className="text-muted-foreground size-4 shrink-0" />
            ) : (
              <FolderIcon className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className="truncate font-medium">{node.name}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
              {node.noteCount}
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                aria-label={`${node.name} folder actions`}
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => openCreate(node.id)}>
                  <PlusIcon />
                  New subfolder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameFolder(node)}>
                  <PencilIcon />
                  Rename
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteFolder(node)}
              >
                <Trash2Icon />
                Delete folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded ? (
          <ul className="mt-0.5 space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    )
  }

  const rootHref = folderHref(subjectId, null)
  const rootSelected = selectedFolderId === null

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Folders</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openCreate(null)}
          >
            <PlusIcon />
            New folder
          </Button>
        </div>

        <nav aria-label="Subject folders" className="space-y-0.5">
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-md pr-1',
              rootSelected && 'bg-muted',
            )}
          >
            <span className="size-7 shrink-0" />
            <Link
              href={rootHref}
              className="hover:bg-muted/80 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-sm"
            >
              <FolderOpenIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate font-medium">Subject root</span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                {rootNoteCount}
              </span>
            </Link>
          </div>

          {tree.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-xs">
              No folders yet. Create one to organize notes inside this subject.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {tree.map((node) => renderNode(node, 0))}
            </ul>
          )}
        </nav>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            createForm.reset({ name: '' })
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitCreate}>
            <DialogHeader>
              <DialogTitle>
                {createParentId ? 'New subfolder' : 'New folder'}
              </DialogTitle>
              <DialogDescription>
                {createParentId
                  ? 'Create a folder nested under the selected folder.'
                  : 'Create a folder at the root of this subject.'}
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-folder-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="create-folder-name"
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
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
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
              <DialogTitle>Rename folder</DialogTitle>
              <DialogDescription>
                Update the name shown in the folder tree.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={renameForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rename-folder-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="rename-folder-name"
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
            <AlertDialogTitle>Delete this folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Notes and subfolders inside it move up to the parent folder (or
              subject root). Notes are not deleted.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete folder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
