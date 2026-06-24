'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient, authPublicUrl } from '@/lib/auth-client'
import { getSafeReturnTo } from '@/lib/return-to'
import { showErrorToast } from '@/lib/utils'

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignupFormValues = z.infer<typeof signupSchema>

type SignupFormProps = {
  returnTo?: string
}

export function SignupForm({ returnTo }: SignupFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const safeReturnTo = getSafeReturnTo(
    returnTo ?? searchParams.get('returnTo'),
    '/app',
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const signUp = useMutation({
    mutationFn: async ({ name, email, password }: SignupFormValues) => {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: `${authPublicUrl}${safeReturnTo}`,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not create account.')
      }
    },
    onSuccess: () => {
      router.push(safeReturnTo)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not create account.', error)
    },
  })

  const errorMessage =
    signUp.error instanceof Error ? signUp.error.message : null

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Create account
        </CardTitle>
        <CardDescription>
          Enter your details to get started. You’ll use your email to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => {
            signUp.reset()
            signUp.mutate(values)
          })}
        >
          <FieldGroup>
            <Field data-invalid={errors.name ? 'true' : undefined}>
              <FieldLabel htmlFor="signup-name">Name</FieldLabel>
              <Input
                autoComplete="name"
                id="signup-name"
                placeholder="Ada Lovelace"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={errors.email ? 'true' : undefined}>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                autoComplete="email"
                id="signup-email"
                placeholder="you@example.com"
                type="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={errors.password ? 'true' : undefined}>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="signup-password"
                placeholder="At least 8 characters"
                type="password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldDescription>
                Minimum 8 characters. Use a unique passphrase in production.
              </FieldDescription>
              <FieldError errors={[errors.password]} />
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button className="w-full" loading={signUp.isPending} type="submit">
            Sign up
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t-0 pt-0">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            href={`/login?returnTo=${encodeURIComponent(safeReturnTo)}`}
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
