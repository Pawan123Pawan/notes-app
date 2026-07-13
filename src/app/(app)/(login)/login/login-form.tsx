'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { GitHubIcon, GoogleIcon } from '@/components/icons'
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
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient, authPublicUrl } from '@/lib/auth-client'
import { getSafeReturnTo } from '@/lib/return-to'
import { showErrorToast } from '@/lib/utils'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginFormProps = {
  googleOAuthEnabled: boolean
  githubOAuthEnabled: boolean
  returnTo?: string
}

export function LoginForm({
  googleOAuthEnabled,
  githubOAuthEnabled,
  returnTo,
}: LoginFormProps) {
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signInEmail = useMutation({
    mutationFn: async ({ email, password }: LoginFormValues) => {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: `${authPublicUrl}${safeReturnTo}`,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not sign in.')
      }
    },
    onSuccess: () => {
      router.push(safeReturnTo)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not sign in.', error)
    },
  })

  const signInGoogle = useMutation({
    mutationFn: async () => {
      try {
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: `${authPublicUrl}${safeReturnTo}`,
        })
      } catch {
        throw new Error('Google sign-in could not start.')
      }
    },
    onError: (error) => {
      showErrorToast('Google sign-in could not start.', error)
    },
  })

  const signInGithub = useMutation({
    mutationFn: async () => {
      try {
        await authClient.signIn.social({
          provider: 'github',
          callbackURL: `${authPublicUrl}${safeReturnTo}`,
        })
      } catch {
        throw new Error('GitHub sign-in could not start.')
      }
    },
    onError: (error) => {
      showErrorToast('GitHub sign-in could not start.', error)
    },
  })

  const busy =
    signInEmail.isPending || signInGoogle.isPending || signInGithub.isPending

  const authError =
    (signInEmail.error instanceof Error && signInEmail.error.message) ||
    (signInGoogle.error instanceof Error && signInGoogle.error.message) ||
    (signInGithub.error instanceof Error && signInGithub.error.message) ||
    null

  const oauthEnabled = googleOAuthEnabled || githubOAuthEnabled

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription>
          {oauthEnabled
            ? 'Use your email, Google, or GitHub to access your account.'
            : 'Use your email to access your account.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {oauthEnabled ? (
          <div className="flex flex-col gap-3">
            {githubOAuthEnabled ? (
              <Button
                className="w-full gap-2"
                disabled={busy}
                loading={signInGithub.isPending}
                onClick={() => signInGithub.mutate()}
                type="button"
                variant="outline"
              >
                {!signInGithub.isPending ? <GitHubIcon /> : null}
                Continue with GitHub
              </Button>
            ) : null}
            {googleOAuthEnabled ? (
              <Button
                className="w-full gap-2"
                disabled={busy}
                loading={signInGoogle.isPending}
                onClick={() => signInGoogle.mutate()}
                type="button"
                variant="outline"
              >
                {!signInGoogle.isPending ? <GoogleIcon /> : null}
                Continue with Google
              </Button>
            ) : null}
          </div>
        ) : null}

        {oauthEnabled ? (
          <FieldSeparator childrenClassName="bg-card">or</FieldSeparator>
        ) : null}

        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => {
            signInEmail.reset()
            signInEmail.mutate(values)
          })}
        >
          <FieldGroup>
            <Field data-invalid={errors.email ? 'true' : undefined}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input
                autoComplete="email"
                id="login-email"
                placeholder="you@example.com"
                type="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={errors.password ? 'true' : undefined}>
              <div className="flex flex-row items-center justify-between gap-2">
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <Link
                  className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
                  href={`/forgot-password?returnTo=${encodeURIComponent(safeReturnTo)}`}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                autoComplete="current-password"
                id="login-password"
                placeholder="••••••••"
                type="password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>
          </FieldGroup>

          {authError ? (
            <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
              {authError}
            </FieldError>
          ) : null}

          <Button
            className="w-full"
            disabled={busy}
            loading={signInEmail.isPending}
            type="submit"
          >
            Sign in with email
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-muted-foreground text-sm">
          No account?{' '}
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            href={`/signup?returnTo=${encodeURIComponent(safeReturnTo)}`}
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
