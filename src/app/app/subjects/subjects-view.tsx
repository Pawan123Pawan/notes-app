'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import { AddSubjectButton } from '@/app/app/subjects/add-subject-button'
import { FolderTree } from '@/app/app/subjects/[subjectId]/components/folder-tree'
import { SubjectsListSkeleton } from '@/components/app-skeletons'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { cn, showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/react'

type SubjectListItem = {
  id: string
  name: string
  noteCount: number
}

function SubjectFolderTreeCard({
  subject,
  expanded,
  onToggle,
}: {
  subject: SubjectListItem
  expanded: boolean
  onToggle: () => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const manageHref = `/app/subjects/${subject.id}`
  const newNoteHref = `/app/new?subjectId=${subject.id}`
  const browseHref = `/app?subjectId=${subject.id}`

  const foldersQuery = useQuery({
    ...trpc.folders.listTree.queryOptions({ subjectId: subject.id }),
    enabled: expanded,
  })

  const rootNotesQuery = useQuery({
    ...trpc.notes.list.queryOptions({
      subjectId: subject.id,
      folderId: null,
      limit: 50,
    }),
    enabled: expanded,
  })

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

  const folders = foldersQuery.data ?? []
  const folderCount = folders.length

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
              aria-expanded={expanded}
              onClick={onToggle}
            >
              <span
                className={cn(
                  'bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                  expanded && 'bg-primary/10 text-primary',
                )}
              >
                {expanded ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </span>
              <div className="min-w-0 space-y-1">
                <CardTitle className="truncate text-base">
                  {subject.name}
                </CardTitle>
                <CardDescription>
                  {subject.noteCount}{' '}
                  {subject.noteCount === 1 ? 'note' : 'notes'}
                  {expanded && !foldersQuery.isLoading
                    ? ` · ${folderCount} ${folderCount === 1 ? 'notes folder' : 'notes folders'}`
                    : null}
                </CardDescription>
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-1.5">
              <BaseButton asChild variant="outline" size="sm">
                <Link
                  href={manageHref}
                  onClick={() => triggerRouteProgressStart(manageHref)}
                >
                  Open
                </Link>
              </BaseButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`${subject.name} actions`}
                  >
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href={newNoteHref}
                        onClick={() => triggerRouteProgressStart(newNoteHref)}
                      >
                        <PlusIcon />
                        New note
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={browseHref}
                        onClick={() => triggerRouteProgressStart(browseHref)}
                      >
                        <FolderOpenIcon />
                        Browse on dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={manageHref}
                        onClick={() => triggerRouteProgressStart(manageHref)}
                      >
                        <Settings2Icon />
                        Manage subject
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2Icon />
                    Delete subject
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {expanded ? (
          <CardContent className="bg-muted/15 py-4">
            {foldersQuery.isLoading || rootNotesQuery.isLoading ? (
              <div
                className="space-y-2"
                aria-busy="true"
                aria-label="Loading notes folders"
              >
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-[92%]" />
                <Skeleton className="h-9 w-[84%]" />
                <Skeleton className="h-9 w-[70%]" />
              </div>
            ) : (
              <FolderTree
                subjectId={subject.id}
                subjectName={subject.name}
                folders={folders}
                selectedFolderId={null}
                rootNoteCount={rootNotesQuery.data?.items.length ?? 0}
                showHeader={false}
              />
            )}
          </CardContent>
        ) : null}
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              Notes in this subject will be kept but removed from the folder.
              Nested folders will be deleted. This action cannot be undone.
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

export function SubjectsView() {
  const trpc = useTRPC()
  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())
  const subjects = subjectsQuery.data ?? []
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    null,
  )

  if (subjectsQuery.isLoading) {
    return <SubjectsListSkeleton />
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <FolderOpenIcon className="text-muted-foreground size-8" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No subjects yet</p>
            <p className="text-muted-foreground text-sm">
              Create a subject, then nest notes folders for chapters, topics, or
              exam prep.
            </p>
          </div>
          <AddSubjectButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {subjects.map((subject) => (
        <SubjectFolderTreeCard
          key={subject.id}
          subject={subject}
          expanded={expandedSubjectId === subject.id}
          onToggle={() =>
            setExpandedSubjectId((current) =>
              current === subject.id ? null : subject.id,
            )
          }
        />
      ))}
    </div>
  )
}
