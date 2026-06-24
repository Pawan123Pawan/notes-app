'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { authClient, authPublicUrl } from '@/lib/auth-client'
import { getSafeReturnTo } from '@/lib/return-to'
import { showErrorToast } from '@/lib/utils'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const twoFactorSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app'),
})

const backupCodeSchema = z.object({
  code: z.string().trim().min(1, 'Enter a backup code'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type TwoFactorValues = z.infer<typeof twoFactorSchema>
type BackupCodeValues = z.infer<typeof backupCodeSchema>

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
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'backup'>(
    'totp',
  )
  const [trustDevice, setTrustDevice] = useState(true)
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
  const {
    register: registerTwoFactor,
    handleSubmit: handleTwoFactorSubmit,
    formState: { errors: twoFactorErrors },
  } = useForm<TwoFactorValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '' },
  })
  const {
    register: registerBackupCode,
    handleSubmit: handleBackupCodeSubmit,
    formState: { errors: backupCodeErrors },
  } = useForm<BackupCodeValues>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: { code: '' },
  })

  const signInEmail = useMutation({
    mutationFn: async ({ email, password }: LoginFormValues) => {
      let requiresTwoFactor = false
      const { error } = await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: `${authPublicUrl}${safeReturnTo}`,
        },
        {
          onSuccess(context) {
            requiresTwoFactor = Boolean(context.data?.twoFactorRedirect)
          },
        },
      )
      if (error) {
        throw new Error(error.message ?? 'Could not sign in.')
      }
      return { requiresTwoFactor }
    },
    onSuccess: ({ requiresTwoFactor }) => {
      if (requiresTwoFactor) {
        setIsTwoFactorStep(true)
        return
      }
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

  const verifyTwoFactor = useMutation({
    mutationFn: async ({ code }: TwoFactorValues) => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice,
      })
      if (error) {
        throw new Error(
          error.message ?? 'Could not verify authentication code.',
        )
      }
    },
    onSuccess: () => {
      router.push(safeReturnTo)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not verify two-factor authentication code.', error)
    },
  })
  const verifyBackupCode = useMutation({
    mutationFn: async ({ code }: BackupCodeValues) => {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code,
        trustDevice,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not verify backup code.')
      }
    },
    onSuccess: () => {
      router.push(safeReturnTo)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not verify backup code.', error)
    },
  })

  const busy =
    signInEmail.isPending ||
    signInGoogle.isPending ||
    signInGithub.isPending ||
    verifyTwoFactor.isPending ||
    verifyBackupCode.isPending

  const authError =
    (signInEmail.error instanceof Error && signInEmail.error.message) ||
    (signInGoogle.error instanceof Error && signInGoogle.error.message) ||
    (signInGithub.error instanceof Error && signInGithub.error.message) ||
    (verifyTwoFactor.error instanceof Error && verifyTwoFactor.error.message) ||
    (verifyBackupCode.error instanceof Error &&
      verifyBackupCode.error.message) ||
    null

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription>
          {isTwoFactorStep
            ? 'Enter the code from your authenticator app to finish signing in.'
            : 'Use your email, Google, or GitHub to access your account.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!isTwoFactorStep ? (
          <>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full gap-2"
                disabled={busy || !githubOAuthEnabled}
                loading={signInGithub.isPending && githubOAuthEnabled}
                onClick={() => signInGithub.mutate()}
                type="button"
                variant="outline"
              >
                {!signInGithub.isPending ? <GitHubIcon /> : null}
                Continue with GitHub
              </Button>
              {!githubOAuthEnabled ? (
                <p className="text-muted-foreground text-center text-xs">
                  GitHub sign-in is disabled. Set{' '}
                  <code className="bg-muted rounded px-1 py-0.5 text-[0.7rem]">
                    GITHUB_CLIENT_ID
                  </code>{' '}
                  and{' '}
                  <code className="bg-muted rounded px-1 py-0.5 text-[0.7rem]">
                    GITHUB_CLIENT_SECRET
                  </code>{' '}
                  to enable it.
                </p>
              ) : null}
              <Button
                className="w-full gap-2"
                disabled={busy || !googleOAuthEnabled}
                loading={signInGoogle.isPending && googleOAuthEnabled}
                onClick={() => signInGoogle.mutate()}
                type="button"
                variant="outline"
              >
                {!signInGoogle.isPending ? <GoogleIcon /> : null}
                Continue with Google
              </Button>
              {!googleOAuthEnabled ? (
                <p className="text-muted-foreground text-center text-xs">
                  Google sign-in is disabled. Set{' '}
                  <code className="bg-muted rounded px-1 py-0.5 text-[0.7rem]">
                    GOOGLE_CLIENT_ID
                  </code>{' '}
                  and{' '}
                  <code className="bg-muted rounded px-1 py-0.5 text-[0.7rem]">
                    GOOGLE_CLIENT_SECRET
                  </code>{' '}
                  to enable it.
                </p>
              ) : null}
            </div>

            <FieldSeparator childrenClassName="bg-card">or</FieldSeparator>

            <form
              className="flex flex-col gap-5"
              noValidate
              onSubmit={handleSubmit((values) => {
                signInEmail.reset()
                verifyTwoFactor.reset()
                verifyBackupCode.reset()
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
          </>
        ) : (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={
              twoFactorMethod === 'totp'
                ? handleTwoFactorSubmit((values) => {
                    verifyBackupCode.reset()
                    verifyTwoFactor.mutate(values)
                  })
                : handleBackupCodeSubmit((values) => {
                    verifyTwoFactor.reset()
                    verifyBackupCode.mutate(values)
                  })
            }
          >
            <FieldGroup>
              {twoFactorMethod === 'totp' ? (
                <Field data-invalid={twoFactorErrors.code ? 'true' : undefined}>
                  <FieldLabel htmlFor="login-2fa-code">
                    Authentication code
                  </FieldLabel>
                  <Input
                    aria-invalid={!!twoFactorErrors.code}
                    autoComplete="one-time-code"
                    id="login-2fa-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    {...registerTwoFactor('code')}
                  />
                  <FieldError errors={[twoFactorErrors.code]} />
                </Field>
              ) : (
                <Field
                  data-invalid={backupCodeErrors.code ? 'true' : undefined}
                >
                  <FieldLabel htmlFor="login-backup-code">
                    Backup code
                  </FieldLabel>
                  <Input
                    aria-invalid={!!backupCodeErrors.code}
                    autoComplete="one-time-code"
                    id="login-backup-code"
                    placeholder="Enter your backup code"
                    {...registerBackupCode('code')}
                  />
                  <FieldError errors={[backupCodeErrors.code]} />
                </Field>
              )}
            </FieldGroup>

            {authError ? (
              <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
                {authError}
              </FieldError>
            ) : null}
            {twoFactorMethod === 'backup' ? (
              <p className="text-muted-foreground text-xs">
                Recovery sign-in uses a one-time backup code. After signing in,
                disable or reconfigure 2FA in Security settings.
              </p>
            ) : null}
            <div className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Trust this device</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Skip two-factor prompts on this browser for up to 30 days.
                </p>
              </div>
              <Switch
                aria-label="Trust this device"
                checked={trustDevice}
                disabled={busy}
                onCheckedChange={setTrustDevice}
              />
            </div>

            <Button
              className="w-full"
              disabled={busy}
              loading={
                twoFactorMethod === 'totp'
                  ? verifyTwoFactor.isPending
                  : verifyBackupCode.isPending
              }
              type="submit"
            >
              {twoFactorMethod === 'totp'
                ? 'Verify authenticator code'
                : 'Verify backup code'}
            </Button>
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => {
                verifyTwoFactor.reset()
                verifyBackupCode.reset()
                setTwoFactorMethod(
                  twoFactorMethod === 'totp' ? 'backup' : 'totp',
                )
              }}
              type="button"
              variant="outline"
            >
              {twoFactorMethod === 'totp'
                ? 'Use a backup code instead'
                : 'Use authenticator code instead'}
            </Button>
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => {
                setIsTwoFactorStep(false)
                verifyTwoFactor.reset()
                verifyBackupCode.reset()
                setTwoFactorMethod('totp')
                setTrustDevice(true)
              }}
              type="button"
              variant="outline"
            >
              Use a different account
            </Button>
          </form>
        )}
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
