'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'

import {
  NoteCard,
  type NoteCardNote,
  type NoteCardSubject,
} from '@/components/note-card'
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
import { cn, showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/react'

export type SortableNoteCardsProps = {
  notes: NoteCardNote[]
  subjects: NoteCardSubject[]
  subjectId: string
  /** When set (including `null` for subject root), scopes list/reorder to that folder. */
  folderId?: string | null
  listLimit?: number
}

function SortableNoteCardItem({
  note,
  subjects,
}: {
  note: NoteCardNote
  subjects: NoteCardSubject[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

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
      <NoteCard note={note} subjects={subjects} />
    </div>
  )
}

export function SortableNoteCards({
  notes,
  subjects,
  subjectId,
  folderId,
  listLimit = 50,
}: SortableNoteCardsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const listInput =
    folderId !== undefined
      ? ({ subjectId, folderId, limit: listLimit } as const)
      : ({ subjectId, limit: listLimit } as const)
  const listQueryKey = trpc.notes.list.queryKey(listInput)

  const hasReadNotes = notes.some((note) => note.lastViewedAt != null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const reorderMutation = useMutation(
    trpc.notes.reorder.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: listQueryKey })

        const previous = queryClient.getQueryData(listQueryKey)

        queryClient.setQueryData(listQueryKey, (current) => {
          if (!current) {
            return current
          }

          const byId = new Map(current.items.map((note) => [note.id, note]))
          const nextItems = input.noteIds
            .map((id) => byId.get(id))
            .filter((note): note is (typeof current.items)[number] =>
              Boolean(note),
            )

          return {
            ...current,
            items: nextItems,
          }
        })

        return { previous }
      },
      onError: (error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(listQueryKey, context.previous)
        }

        showErrorToast(
          'Could not reorder notes',
          error,
          'Unable to save the new note order.',
        )
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.notes.list.queryKey(),
        })
      },
    }),
  )

  const clearAllReadMutation = useMutation(
    trpc.notes.clearAllRead.mutationOptions({
      onSuccess: async (data) => {
        setClearAllOpen(false)
        await queryClient.invalidateQueries({
          queryKey: trpc.notes.list.queryKey(),
        })
        toast.success(
          data.updatedCount === 1
            ? 'Cleared read status on 1 note'
            : `Cleared read status on ${data.updatedCount} notes`,
        )
      },
      onError: (error) => {
        showErrorToast(
          'Could not clear read status',
          error,
          'Unable to clear read marks for these notes.',
        )
      },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = notes.findIndex((note) => note.id === active.id)
    const newIndex = notes.findIndex((note) => note.id === over.id)

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const nextNotes = arrayMove(notes, oldIndex, newIndex)

    reorderMutation.mutate({
      subjectId,
      ...(folderId !== undefined ? { folderId } : {}),
      noteIds: nextNotes.map((note) => note.id),
    })
  }

  const confirmClearAllRead = () => {
    clearAllReadMutation.mutate({
      subjectId,
      ...(folderId !== undefined ? { folderId } : {}),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasReadNotes}
          loading={clearAllReadMutation.isPending}
          onClick={() => setClearAllOpen(true)}
        >
          Clear all read
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={notes.map((note) => note.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <SortableNoteCardItem
                key={note.id}
                note={note}
                subjects={subjects}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all read status?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the Read badge from every note in this list. You can
              mark notes as read again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearAllReadMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={clearAllReadMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                confirmClearAllRead()
              }}
            >
              {clearAllReadMutation.isPending ? 'Clearing…' : 'Clear all read'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
