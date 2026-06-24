'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

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
import { authClient } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

const onboardingSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters'),
  workspaceSlug: z
    .string()
    .trim()
    .min(2, 'Workspace URL must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function WorkspaceOnboardingForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      workspaceName: '',
      workspaceSlug: '',
    },
  })

  const createWorkspace = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      const { data, error } = await authClient.organization.create({
        name: values.workspaceName,
        slug: values.workspaceSlug,
      })

      if (error) {
        throw new Error(error.message ?? 'Could not create workspace.')
      }

      const workspaceId = data?.id
      if (!workspaceId) {
        throw new Error(
          'Workspace was created, but no workspace id was returned.',
        )
      }
      const workspaceSlug = data?.slug || values.workspaceSlug

      const { error: setActiveError } = await authClient.organization.setActive(
        {
          organizationId: workspaceId,
        },
      )

      if (setActiveError) {
        throw new Error(
          setActiveError.message ?? 'Could not activate workspace.',
        )
      }

      return workspaceSlug
    },
    onSuccess: (workspaceSlug) => {
      router.push(`/app/${workspaceSlug}`)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast(
        'Something went wrong while creating your workspace.',
        error,
      )
    },
  })

  const errorMessage =
    createWorkspace.error instanceof Error
      ? createWorkspace.error.message
      : createWorkspace.isError
        ? 'Something went wrong while creating your workspace.'
        : null

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Create your workspace
        </CardTitle>
        <CardDescription>
          You need at least one workspace to continue into the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => {
            createWorkspace.reset()
            createWorkspace.mutate(values)
          })}
        >
          <FieldGroup>
            <Field data-invalid={errors.workspaceName ? 'true' : undefined}>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input
                id="workspace-name"
                placeholder="Acme Inc"
                aria-invalid={!!errors.workspaceName}
                {...register('workspaceName', {
                  onChange: (event) => {
                    const generatedSlug = toSlug(event.target.value)
                    setValue('workspaceSlug', generatedSlug, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  },
                })}
              />
              <FieldError errors={[errors.workspaceName]} />
            </Field>

            <Field data-invalid={errors.workspaceSlug ? 'true' : undefined}>
              <FieldLabel htmlFor="workspace-slug">
                Workspace URL slug
              </FieldLabel>
              <Input
                id="workspace-slug"
                placeholder="acme-inc"
                aria-invalid={!!errors.workspaceSlug}
                {...register('workspaceSlug')}
              />
              <FieldError errors={[errors.workspaceSlug]} />
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button
            className="w-full"
            loading={createWorkspace.isPending}
            type="submit"
          >
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
