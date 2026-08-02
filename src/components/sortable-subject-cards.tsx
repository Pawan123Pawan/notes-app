'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderOpenIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
} from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { cn, showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/react'

export type SortableSubject = {
  id: string
  name: string
  noteCount: number
}

export type SortableSubjectCardsProps = {
  subjects: SortableSubject[]
  /** Where the subject title links. */
  titleHref: 'notes' | 'manage'
  unassignedSlot?: ReactNode
}

function subjectTitleHref(
  subjectId: string,
  mode: SortableSubjectCardsProps['titleHref'],
) {
  return mode === 'notes'
    ? `/app?subjectId=${subjectId}`
    : `/app/subjects/${subjectId}`
}

function SubjectFolderCard({
  subject,
  titleHref,
}: {
  subject: SortableSubject
  titleHref: SortableSubjectCardsProps['titleHref']
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const manageHref = `/app/subjects/${subject.id}`
  const newNoteHref = `/app/new?subjectId=${subject.id}`
  const notesHref = `/app?subjectId=${subject.id}`
  const primaryHref = subjectTitleHref(subject.id, titleHref)

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
              href={primaryHref}
              className="min-w-0 flex-1"
              onClick={() => triggerRouteProgressStart(primaryHref)}
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
                  {titleHref === 'manage' ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={notesHref}
                        onClick={() => triggerRouteProgressStart(notesHref)}
                      >
                        <FolderOpenIcon />
                        Browse notes folders
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
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

function SortableSubjectCardItem({
  subject,
  titleHref,
}: {
  subject: SortableSubject
  titleHref: SortableSubjectCardsProps['titleHref']
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'z-10 opacity-80',
      )}
      {...attributes}
      {...listeners}
    >
      <SubjectFolderCard subject={subject} titleHref={titleHref} />
    </div>
  )
}

export function SortableSubjectCards({
  subjects,
  titleHref,
  unassignedSlot,
}: SortableSubjectCardsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listQueryKey = trpc.subjects.list.queryKey()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const reorderMutation = useMutation(
    trpc.subjects.reorder.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: listQueryKey })

        const previous = queryClient.getQueryData(listQueryKey)

        queryClient.setQueryData(listQueryKey, (current) => {
          if (!current) {
            return current
          }

          const byId = new Map(current.map((subject) => [subject.id, subject]))
          return input.subjectIds
            .map((id) => byId.get(id))
            .filter((subject): subject is (typeof current)[number] =>
              Boolean(subject),
            )
        })

        return { previous }
      },
      onError: (error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(listQueryKey, context.previous)
        }

        showErrorToast(
          'Could not reorder subjects',
          error,
          'Unable to save the new subject order.',
        )
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: listQueryKey,
        })
      },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = subjects.findIndex((subject) => subject.id === active.id)
    const newIndex = subjects.findIndex((subject) => subject.id === over.id)

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const nextSubjects = arrayMove(subjects, oldIndex, newIndex)

    reorderMutation.mutate({
      subjectIds: nextSubjects.map((subject) => subject.id),
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={subjects.map((subject) => subject.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SortableSubjectCardItem
              key={subject.id}
              subject={subject}
              titleHref={titleHref}
            />
          ))}
          {unassignedSlot}
        </div>
      </SortableContext>
    </DndContext>
  )
}
