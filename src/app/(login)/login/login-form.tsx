'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
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
import { sanitizeReturnTo } from '@/lib/return-to'
import { showErrorToast } from '@/lib/utils'

const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInValues = z.infer<typeof signInSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'))

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signInMutation = useMutation({
    mutationFn: async (values: SignInValues) => {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}${returnTo}`,
      })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      router.push(returnTo)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Sign in failed', error, 'Unable to sign in.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your notes.</CardDescription>
      </CardHeader>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => signInMutation.mutate(values))}
      >
        <CardContent>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
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
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Link
                      href="/forgot-password"
                      className="text-primary text-sm hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    {...field}
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
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
            loading={signInMutation.isPending}
          >
            Sign in
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
