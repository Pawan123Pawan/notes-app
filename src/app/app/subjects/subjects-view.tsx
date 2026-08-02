'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderOpenIcon, PlusIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import { SortableSubjectCards } from '@/components/sortable-subject-cards'
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
                    <FieldLabel htmlFor="subject-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="subject-name"
                      placeholder="e.g. Biology"
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
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Drag a card to reorder subjects.
          </p>
          <SortableSubjectCards subjects={subjects} titleHref="manage" />
        </div>
      )}
    </div>
  )
}
