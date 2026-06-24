'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ChevronLeftIcon } from 'lucide-react'
import * as z from 'zod'

import { BaseButton, Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { authClient, authPublicUrl } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const requestReset = useMutation({
    mutationFn: async ({ email }: ForgotPasswordFormValues) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${authPublicUrl}/reset-password`,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not send reset email.')
      }
    },
    onError: (error) => {
      showErrorToast('Could not send reset email.', error)
    },
  })

  if (requestReset.isSuccess) {
    const submittedEmail = requestReset.variables?.email ?? ''
    return (
      <Card className="ring-border/60 border-0 shadow-none ring-1">
        <CardHeader className="gap-1 pb-2 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Check your inbox
          </CardTitle>
          <CardDescription>
            If an account exists for{' '}
            <span className="text-foreground font-medium">
              {submittedEmail}
            </span>
            , we sent a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <BaseButton asChild variant="link" className="h-auto">
            <Link href="/login">
              <ChevronLeftIcon className="size-4" /> Back to sign in
            </Link>
          </BaseButton>
        </CardFooter>
      </Card>
    )
  }

  const errorMessage =
    requestReset.error instanceof Error
      ? requestReset.error.message
      : requestReset.isError
        ? 'Something went wrong.'
        : null

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Forgot password
        </CardTitle>
        <CardDescription>
          Enter your email and we’ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => {
            requestReset.reset()
            requestReset.mutate(values)
          })}
        >
          <FieldGroup>
            <Field data-invalid={errors.email ? 'true' : undefined}>
              <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
              <Input
                autoComplete="email"
                id="forgot-email"
                placeholder="you@example.com"
                type="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button
            className="w-full"
            loading={requestReset.isPending}
            type="submit"
          >
            Send reset link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <BaseButton asChild variant="link" className="h-auto">
          <Link href="/login">
            <ChevronLeftIcon className="size-4" /> Back to sign in
          </Link>
        </BaseButton>
      </CardFooter>
    </Card>
  )
}
