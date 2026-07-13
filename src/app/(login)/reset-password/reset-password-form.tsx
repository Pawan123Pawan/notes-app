'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

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
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordValues) => {
      if (!token) {
        throw new Error('Reset token is missing or invalid.')
      }

      const { data, error: resetError } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      })

      if (resetError) {
        throw resetError
      }

      return data
    },
    onSuccess: () => {
      router.push('/login')
      router.refresh()
    },
    onError: (resetError) => {
      showErrorToast(
        'Reset failed',
        resetError,
        'Unable to reset your password.',
      )
    },
  })

  if (error === 'INVALID_TOKEN' || !token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Request a new
            one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <BaseButton asChild className="w-full">
            <Link href="/forgot-password">Request new link</Link>
          </BaseButton>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Choose a new password for your account.
        </CardDescription>
      </CardHeader>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) =>
          resetPasswordMutation.mutate(values),
        )}
      >
        <CardContent>
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                  <Input
                    {...field}
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            loading={resetPasswordMutation.isPending}
          >
            Reset password
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
