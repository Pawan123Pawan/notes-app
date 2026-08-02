'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { FolderOpenIcon, PlusIcon } from 'lucide-react'

import {
  DashboardFolderCards,
  type FolderCreateState,
} from '@/app/app/components/dashboard-folder-cards'
import {
  DashboardSubjectBrowseSkeleton,
  SubjectsGridSkeleton,
} from '@/components/app-skeletons'
import { SortableNoteCards } from '@/components/sortable-note-cards'
import { SortableSubjectCards } from '@/components/sortable-subject-cards'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BaseButton, Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { useTRPC } from '@/trpc/react'

export type DashboardViewProps = {
  userName: string
}

function DashboardSubjects({ userName }: { userName: string }) {
  const trpc = useTRPC()
  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const subjects = subjectsQuery.data ?? []

  const chrome = (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${userName}.`}
      />
    </div>
  )

  if (subjectsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {chrome}
        <SubjectsGridSkeleton />
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {chrome}
        <Card>
          <CardContent className="flex flex-col gap-4 py-8">
            <FolderOpenIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No subjects yet. Create a subject, then add your first note.
            </p>
            <div className="flex flex-wrap gap-2">
              <BaseButton asChild>
                <Link
                  href="/app/subjects"
                  onClick={() => triggerRouteProgressStart('/app/subjects')}
                >
                  Manage subjects
                </Link>
              </BaseButton>
              <BaseButton asChild variant="outline">
                <Link
                  href="/app/new"
                  onClick={() => triggerRouteProgressStart('/app/new')}
                >
                  Create note
                </Link>
              </BaseButton>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {chrome}
      <SortableSubjectCards subjects={subjects} titleHref="notes" />
    </div>
  )
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

function DashboardSubjectBrowse({ subjectId }: { subjectId: string }) {
  const trpc = useTRPC()
  const searchParams = useSearchParams()
  const folderIdParam = searchParams.get('folderId')

  const [createState, setCreateState] = useState<FolderCreateState>({
    open: false,
    parentId: null,
  })

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
    ? folders.find((folder) => folder.id === selectedFolderId)
    : null

  const childFolders = folders.filter(
    (folder) => folder.parentId === selectedFolderId,
  )

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId,
      folderId: selectedFolderId,
      limit: 50,
    }),
  )

  const notes = notesQuery.data?.items ?? []
  const subjects = subjectsQuery.data ?? []
  const folderPath = folderBreadcrumbPath(folders, selectedFolderId)
  const subjectHref = `/app?subjectId=${subjectId}`

  const newNoteHref = selectedFolderId
    ? `/app/new?subjectId=${subjectId}&folderId=${selectedFolderId}`
    : `/app/new?subjectId=${subjectId}`

  const isLoading =
    subjectQuery.isLoading || foldersQuery.isLoading || notesQuery.isLoading

  if (isLoading) {
    return <DashboardSubjectBrowseSkeleton />
  }

  if (subjectQuery.isError || !subjectQuery.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <p className="text-sm">This subject could not be loaded.</p>
          <BaseButton asChild variant="outline">
            <Link href="/app" onClick={() => triggerRouteProgressStart('/app')}>
              Back to subjects
            </Link>
          </BaseButton>
        </CardContent>
      </Card>
    )
  }

  const subject = subjectQuery.data
  const heading = selectedFolder?.name ?? subject.name
  const description = selectedFolder
    ? `${selectedFolder.noteCount} ${selectedFolder.noteCount === 1 ? 'note' : 'notes'} in this notes folder.`
    : `${subject.noteCount} ${subject.noteCount === 1 ? 'note' : 'notes'} in this subject.`
  const isEmpty = childFolders.length === 0 && notes.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/app"
                  onClick={() => triggerRouteProgressStart('/app')}
                >
                  Dashboard
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
                  const href = `/app?subjectId=${subjectId}&folderId=${folder.id}`

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
          title={heading}
          description={description}
          extraAction={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCreateState({ open: true, parentId: selectedFolderId })
                }
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
            </div>
          }
        />
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-8">
            <p className="text-muted-foreground text-sm">
              {selectedFolderId
                ? 'No notes subfolders or notes here yet.'
                : 'No notes folders or notes in this subject yet.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCreateState({ open: true, parentId: selectedFolderId })
                }
              >
                <PlusIcon />
                New notes folder
              </Button>
              <BaseButton asChild>
                <Link
                  href={newNoteHref}
                  onClick={() => triggerRouteProgressStart(newNoteHref)}
                >
                  Create note
                </Link>
              </BaseButton>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {childFolders.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Notes Folders</h3>
              <DashboardFolderCards
                subjectId={subjectId}
                folders={childFolders}
                allFolders={folders}
                createState={createState}
                onCreateStateChange={setCreateState}
              />
            </section>
          ) : null}

          {notes.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Notes</h3>
              <SortableNoteCards
                notes={notes}
                subjects={subjects}
                subjectId={subjectId}
                folderId={selectedFolderId}
              />
            </section>
          ) : null}
        </div>
      )}

      {childFolders.length === 0 ? (
        <DashboardFolderCards
          subjectId={subjectId}
          folders={[]}
          allFolders={folders}
          createState={createState}
          onCreateStateChange={setCreateState}
        />
      ) : null}
    </div>
  )
}

export function DashboardView({ userName }: DashboardViewProps) {
  const searchParams = useSearchParams()
  const subjectId = searchParams.get('subjectId')

  if (!subjectId) {
    return <DashboardSubjects userName={userName} />
  }

  return <DashboardSubjectBrowse subjectId={subjectId} />
}
