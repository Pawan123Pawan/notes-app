'use client'

import { useQuery } from '@tanstack/react-query'
import { FolderOpenIcon } from 'lucide-react'

import { AddSubjectButton } from '@/app/app/subjects/add-subject-button'
import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import { SortableSubjectCards } from '@/components/sortable-subject-cards'
import { Card, CardContent } from '@/components/ui/card'
import { useTRPC } from '@/trpc/react'

export function SubjectsView() {
  const trpc = useTRPC()
  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())
  const subjects = subjectsQuery.data ?? []

  if (subjectsQuery.isLoading) {
    return <SubjectsGridSkeleton />
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <FolderOpenIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            No subjects yet. Create one to organize your notes.
          </p>
          <AddSubjectButton />
        </CardContent>
      </Card>
    )
  }

  return <SortableSubjectCards subjects={subjects} titleHref="manage" />
}
