'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FolderOpenIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { SubjectsGridSkeleton } from '@/components/app-skeletons'
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { createSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

type CreateSubjectFormValues = {
  name: string
}

function SubjectCard({
  subject,
}: {
  subject: { id: string; name: string; noteCount: number }
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const manageHref = `/app/subjects/${subject.id}`
  const newNoteHref = `/app/new?subjectId=${subject.id}`
  const notesHref = `/app?subjectId=${subject.id}`

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
              href={manageHref}
              className="min-w-0 flex-1"
              onClick={() => triggerRouteProgressStart(manageHref)}
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
                  <DropdownMenuItem asChild>
                    <Link
                      href={notesHref}
                      onClick={() => triggerRouteProgressStart(notesHref)}
                    >
                      <FolderOpenIcon />
                      View notes
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

export function SubjectsView() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const form = useForm<CreateSubjectFormValues>({
    defaultValues: { name: '' },
  })

  const createMutation = useMutation(
    trpc.subjects.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.subjects.list.queryKey(),
        })
        form.reset()
        toast.success('Subject created')
      },
      onError: (error) => {
        showErrorToast(
          'Could not create subject',
          error,
          'Unable to create this subject.',
        )
      },
    }),
  )

  const submitSubject = form.handleSubmit((values) => {
    const input = createSubjectInput.safeParse(values)

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

  const subjects = subjectsQuery.data ?? []

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>New subject</CardTitle>
          <CardDescription>
            Group related notes into folders like Physics, History, or Exam
            prep.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={submitSubject}>
            <FieldGroup className="sm:flex-row sm:items-end">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex-1">
                    <FieldLabel htmlFor="subject-name">Subject name</FieldLabel>
                    <Input
                      {...field}
                      id="subject-name"
                      placeholder="e.g. Organic Chemistry"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
              <Button type="submit" loading={createMutation.isPending}>
                <PlusIcon />
                Add subject
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {subjectsQuery.isLoading ? (
        <SubjectsGridSkeleton />
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <FolderOpenIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No subjects yet. Create one above to organize your notes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  )
}
