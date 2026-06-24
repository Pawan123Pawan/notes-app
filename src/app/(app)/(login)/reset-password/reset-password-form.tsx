'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
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
import { authClient } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const queryError = searchParams.get('error')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  })

  const resetPassword = useMutation({
    mutationFn: async ({
      newPassword,
      token: t,
    }: {
      newPassword: string
      token: string
    }) => {
      const { error } = await authClient.resetPassword({
        newPassword,
        token: t,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not reset password.')
      }
    },
    onSuccess: () => {
      router.push('/login')
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not reset password.', error)
    },
  })

  if (queryError === 'INVALID_TOKEN') {
    return (
      <Card className="ring-border/60 border-0 shadow-none ring-1">
        <CardHeader className="gap-1 pb-2 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Link expired
          </CardTitle>
          <CardDescription>
            This reset link is invalid or has expired. Request a new one from
            the sign-in page.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap justify-center gap-2">
          <BaseButton asChild variant="outline">
            <Link href="/forgot-password">Request reset</Link>
          </BaseButton>
          <BaseButton asChild>
            <Link href="/login">Sign in</Link>
          </BaseButton>
        </CardFooter>
      </Card>
    )
  }

  if (!token) {
    return (
      <Card className="ring-border/60 border-0 shadow-none ring-1">
        <CardHeader className="gap-1 pb-2 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Invalid link
          </CardTitle>
          <CardDescription>
            Open the password reset link from your email, or request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap justify-center gap-2">
          <BaseButton asChild variant="outline">
            <Link href="/forgot-password">Request reset</Link>
          </BaseButton>
          <BaseButton asChild>
            <Link href="/login">Sign in</Link>
          </BaseButton>
        </CardFooter>
      </Card>
    )
  }

  const errorMessage =
    resetPassword.error instanceof Error ? resetPassword.error.message : null

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Set a new password
        </CardTitle>
        <CardDescription>
          Choose a strong password you haven’t used elsewhere.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => {
            resetPassword.reset()
            resetPassword.mutate({ newPassword: values.newPassword, token })
          })}
        >
          <FieldGroup>
            <Field data-invalid={errors.newPassword ? 'true' : undefined}>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="reset-password"
                placeholder="At least 8 characters"
                type="password"
                aria-invalid={!!errors.newPassword}
                {...register('newPassword')}
              />
              <FieldError errors={[errors.newPassword]} />
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button
            className="w-full"
            loading={resetPassword.isPending}
            type="submit"
          >
            Update password
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t-0 pt-0">
        <Link
          className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
          href="/login"
        >
          ← Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
