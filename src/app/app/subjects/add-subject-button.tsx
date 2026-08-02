'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

export type AddSubjectButtonProps = {
  variant?: 'default' | 'outline'
}

export function AddSubjectButton({
  variant = 'default',
}: AddSubjectButtonProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

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
        setCreateOpen(false)
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

  const openCreate = () => {
    form.reset({ name: '' })
    setCreateOpen(true)
  }

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

  return (
    <>
      <Button type="button" variant={variant} onClick={openCreate}>
        <PlusIcon />
        Add subject
      </Button>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            form.reset({ name: '' })
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitSubject}>
            <DialogHeader>
              <DialogTitle>New subject</DialogTitle>
              <DialogDescription>
                Group related notes into folders like Physics, History, or Exam
                prep.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="subject-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="subject-name"
                      placeholder="e.g. Biology"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      disabled={createMutation.isPending}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                <PlusIcon />
                Add subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
