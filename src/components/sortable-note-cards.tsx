'use client'

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
  NoteCard,
  type NoteCardNote,
  type NoteCardSubject,
} from '@/components/note-card'
import { cn, showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/react'

export type SortableNoteCardsProps = {
  notes: NoteCardNote[]
  subjects: NoteCardSubject[]
  subjectId: string | null
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
  listLimit = 50,
}: SortableNoteCardsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const listInput = { subjectId, limit: listLimit } as const
  const listQueryKey = trpc.notes.list.queryKey(listInput)

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
      noteIds: nextNotes.map((note) => note.id),
    })
  }

  return (
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
  )
}
