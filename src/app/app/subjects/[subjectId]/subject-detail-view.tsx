'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  NotesGridSkeleton,
  SubjectDetailSkeleton,
} from '@/components/app-skeletons'
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
import { Badge } from '@/components/ui/badge'
import { BaseButton, Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { NoteStatus } from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { updateSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

export type SubjectDetailViewProps = {
  subjectId: string
}

const statusLabels: Record<NoteStatus, string> = {
  pending: 'Queued',
  processing: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
}

type RenameSubjectFormValues = {
  name: string
}

export function SubjectDetailView({ subjectId }: SubjectDetailViewProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const subjectQuery = useQuery(
    trpc.subjects.getById.queryOptions({ subjectId }),
  )

  const notesQuery = useQuery(
    trpc.notes.list.queryOptions({
      subjectId,
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

  if (subjectQuery.isLoading) {
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

  return (
    <div className="space-y-8">
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
                <Trash2 />
                Delete subject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
                <AlertDialogDescription>
                  Notes in this subject will be kept but removed from the
                  folder. This action cannot be undone.
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

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Notes in this subject</h2>
          <p className="text-muted-foreground text-sm">
            {subject.noteCount} {subject.noteCount === 1 ? 'note' : 'notes'}
          </p>
        </div>

        {notesQuery.isLoading ? (
          <NotesGridSkeleton count={3} />
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 py-8">
              <p className="text-muted-foreground text-sm">
                No notes in this subject yet. Create a note and assign it here.
              </p>
              <BaseButton asChild>
                <Link
                  href={`/app/new?subjectId=${subjectId}`}
                  onClick={() =>
                    triggerRouteProgressStart(`/app/new?subjectId=${subjectId}`)
                  }
                >
                  Create note in this subject
                </Link>
              </BaseButton>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/app/notes/${note.id}`}
                onClick={() =>
                  triggerRouteProgressStart(`/app/notes/${note.id}`)
                }
              >
                <Card className="hover:bg-muted/40 h-full transition-colors">
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-2 text-base">
                        {note.title}
                      </CardTitle>
                      <Badge variant="secondary">
                        {statusLabels[note.status]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm capitalize">
                      {note.sourceType === 'youtube' ? 'YouTube' : 'Transcript'}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
