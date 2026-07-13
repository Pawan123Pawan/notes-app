'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { showErrorToast } from '@/lib/utils'

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignUpValues = z.infer<typeof signUpSchema>

export function SignupForm() {
  const router = useRouter()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpValues) => {
      const { data, error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      router.push('/app')
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Sign up failed', error, 'Unable to create your account.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Start turning transcripts into structured notes.
        </CardDescription>
      </CardHeader>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => signUpMutation.mutate(values))}
      >
        <CardContent>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="signup-name"
                    autoComplete="name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="signup-email"
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
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="signup-password"
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
            loading={signUpMutation.isPending}
          >
            Create account
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
