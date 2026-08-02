'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2Icon } from 'lucide-react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BaseButton, Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { updateSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

import { FolderTree } from './components/folder-tree'

export type SubjectDetailViewProps = {
  subjectId: string
}

type RenameSubjectFormValues = {
  name: string
}

export function SubjectDetailView({ subjectId }: SubjectDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const folderIdParam = searchParams.get('folderId')

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

  const form = useForm<RenameSubjectFormValues>({
    values: {
      name: subjectQuery.data?.name ?? '',
    },
  })

  const updateMutation = useMutation(
    trpc.subjects.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.getById.queryKey({ subjectId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.subjects.list.queryKey(),
          }),
        ])
        toast.success('Subject updated')
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

  const deleteMutation = useMutation(
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

  const submitRename = form.handleSubmit((values) => {
    const input = updateSubjectInput.safeParse({
      subjectId,
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

    updateMutation.mutate(input.data)
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
  const selectedFolder = selectedFolderId
    ? folders.find((folder) => folder.id === selectedFolderId)
    : null
  const notesHeading = selectedFolder
    ? `Notes in ${selectedFolder.name}`
    : 'Notes in subject root'

  const newNoteHref = selectedFolderId
    ? `/app/new?subjectId=${subjectId}&folderId=${selectedFolderId}`
    : `/app/new?subjectId=${subjectId}`

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,18rem)_1fr]">
        <Card className="h-fit">
          <CardContent className="pt-6">
            <FolderTree
              subjectId={subjectId}
              folders={folders}
              selectedFolderId={selectedFolderId}
              rootNoteCount={rootNotesQuery.data?.items.length ?? 0}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{notesHeading}</h2>
              <p className="text-muted-foreground text-sm">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                {selectedFolderId
                  ? null
                  : ` · ${subject.noteCount} total in subject`}
              </p>
            </div>
            <BaseButton asChild>
              <Link
                href={newNoteHref}
                onClick={() => triggerRouteProgressStart(newNoteHref)}
              >
                Create note
              </Link>
            </BaseButton>
          </div>

          {notesQuery.isLoading ? (
            <NotesGridSkeleton count={3} />
          ) : notes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 py-8">
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
              </CardContent>
            </Card>
          ) : (
            <SortableNoteCards
              notes={notes}
              subjects={subjects}
              subjectId={subjectId}
              folderId={selectedFolderId}
              folders={folders}
            />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form noValidate onSubmit={submitRename}>
            <FieldGroup className="sm:flex-row sm:items-end">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex-1">
                    <FieldLabel htmlFor="rename-subject">Name</FieldLabel>
                    <Input
                      {...field}
                      id="rename-subject"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
              <Button type="submit" loading={updateMutation.isPending}>
                Save
              </Button>
            </FieldGroup>
          </form>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">
                <Trash2Icon />
                Delete subject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
                <AlertDialogDescription>
                  Notes in this subject will be kept but removed from the
                  folder. Nested folders will be deleted. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ subjectId })}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete subject'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
