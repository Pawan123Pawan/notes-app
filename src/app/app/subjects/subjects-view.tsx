'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Plus } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { createSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

type CreateSubjectFormValues = {
  name: string
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
                <Plus />
                Add subject
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {subjectsQuery.isLoading ? (
        <div className="flex items-center gap-2 py-8">
          <Spinner />
          <span className="text-muted-foreground text-sm">
            Loading subjects...
          </span>
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <FolderOpen className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No subjects yet. Create one above to organize your notes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/app/subjects/${subject.id}`}
              onClick={() =>
                triggerRouteProgressStart(`/app/subjects/${subject.id}`)
              }
            >
              <Card className="hover:bg-muted/40 h-full transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.noteCount}{' '}
                    {subject.noteCount === 1 ? 'note' : 'notes'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
