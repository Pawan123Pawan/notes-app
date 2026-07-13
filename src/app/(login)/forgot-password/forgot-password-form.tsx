'use client'

import Link from 'next/link'
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

const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const requestResetMutation = useMutation({
    mutationFn: async (values: ForgotPasswordValues) => {
      const { data, error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      })

      if (error) {
        throw error
      }

      return data
    },
    onError: (error) => {
      showErrorToast(
        'Request failed',
        error,
        'Unable to send password reset email.',
      )
    },
  })

  const submitted = requestResetMutation.isSuccess

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          {submitted
            ? 'If an account exists for that email, we sent a reset link. Check your server logs in development.'
            : 'Enter your email and we will send you a reset link.'}
        </CardDescription>
      </CardHeader>
      {submitted ? (
        <CardFooter className="flex-col gap-4">
          <BaseButton asChild className="w-full" variant="outline">
            <Link href="/login">Back to sign in</Link>
          </BaseButton>
        </CardFooter>
      ) : (
        <form
          noValidate
          onSubmit={form.handleSubmit((values) =>
            requestResetMutation.mutate(values),
          )}
        >
          <CardContent>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
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
              loading={requestResetMutation.isPending}
            >
              Send reset link
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
