'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { SettingsSection } from './settings-section'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CopyToClipboardButton } from '@/components/ui/copy-to-clipboard'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient, authPublicUrl } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

const enableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Enter your current password'),
})

const verifyTotpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app'),
})

const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Enter your current password'),
})

const backupCodesSchema = z.object({
  password: z.string().min(1, 'Enter your current password'),
})

type EnableTwoFactorValues = z.infer<typeof enableTwoFactorSchema>
type VerifyTotpValues = z.infer<typeof verifyTotpSchema>
type DisableTwoFactorValues = z.infer<typeof disableTwoFactorSchema>
type BackupCodesValues = z.infer<typeof backupCodesSchema>

type TwoFactorEnableResult = {
  totpURI: string
  backupCodes?: string[]
}

function withTotpImage(totpURI: string) {
  try {
    const uri = new URL(totpURI)
    const imageUrl = new URL('/favicon.ico', authPublicUrl).toString()
    if (!uri.searchParams.get('image')) {
      uri.searchParams.set('image', imageUrl)
    }
    return uri.toString()
  } catch {
    return totpURI
  }
}

export function SecuritySettings() {
  const router = useRouter()
  const {
    data: session,
    isPending: sessionPending,
    refetch: refetchSession,
  } = authClient.useSession()

  const enableForm = useForm<EnableTwoFactorValues>({
    resolver: zodResolver(enableTwoFactorSchema),
    defaultValues: { password: '' },
  })
  const verifyForm = useForm<VerifyTotpValues>({
    resolver: zodResolver(verifyTotpSchema),
    defaultValues: { code: '' },
  })
  const disableForm = useForm<DisableTwoFactorValues>({
    resolver: zodResolver(disableTwoFactorSchema),
    defaultValues: { password: '' },
  })
  const backupCodesForm = useForm<BackupCodesValues>({
    resolver: zodResolver(backupCodesSchema),
    defaultValues: { password: '' },
  })

  const enableTwoFactor = useMutation({
    mutationFn: async (
      values: EnableTwoFactorValues,
    ): Promise<TwoFactorEnableResult> => {
      const { data, error } = await authClient.twoFactor.enable({
        password: values.password,
      })

      if (error) {
        throw new Error(error.message ?? 'Could not enable two-factor.')
      }

      const totpURI =
        data && typeof data === 'object' && 'totpURI' in data
          ? data.totpURI
          : null

      if (typeof totpURI !== 'string' || totpURI.length === 0) {
        throw new Error('TOTP setup did not return a valid URI.')
      }

      const backupCodes =
        data && typeof data === 'object' && 'backupCodes' in data
          ? data.backupCodes
          : undefined

      return {
        totpURI,
        backupCodes: Array.isArray(backupCodes)
          ? backupCodes.filter(
              (code): code is string => typeof code === 'string',
            )
          : undefined,
      }
    },
    onSuccess: () => {
      enableForm.reset()
    },
    onError: (error) => {
      showErrorToast('Could not enable two-factor authentication.', error)
    },
  })

  const verifyTotp = useMutation({
    mutationFn: async (values: VerifyTotpValues) => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: values.code,
        trustDevice: true,
      })
      if (error) {
        throw new Error(
          error.message ??
            'Could not verify your two-factor authentication code.',
        )
      }
    },
    onSuccess: async () => {
      verifyForm.reset()
      await refetchSession()
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not verify authenticator code.', error)
    },
  })

  const disableTwoFactor = useMutation({
    mutationFn: async (values: DisableTwoFactorValues) => {
      const { error } = await authClient.twoFactor.disable({
        password: values.password,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not disable two-factor.')
      }
    },
    onSuccess: async () => {
      disableForm.reset()
      enableTwoFactor.reset()
      verifyTotp.reset()
      await refetchSession()
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not disable two-factor authentication.', error)
    },
  })
  const generateBackupCodes = useMutation({
    mutationFn: async (values: BackupCodesValues): Promise<string[]> => {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({
        password: values.password,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not generate backup codes.')
      }
      const backupCodes =
        data && typeof data === 'object' && 'backupCodes' in data
          ? data.backupCodes
          : []
      return Array.isArray(backupCodes)
        ? backupCodes.filter((code): code is string => typeof code === 'string')
        : []
    },
    onSuccess: () => {
      backupCodesForm.reset()
    },
    onError: (error) => {
      showErrorToast('Could not generate backup codes.', error)
    },
  })

  const twoFactorEnabled = session?.user.twoFactorEnabled ?? false

  if (sessionPending || !session?.user) {
    return (
      <p className="text-muted-foreground text-sm">
        Loading security settings…
      </p>
    )
  }

  return (
    <SettingsSection
      description="Protect your account with an authenticator app and one-time passcodes."
      title="Security"
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Two-factor authentication (TOTP)</CardTitle>
            <CardDescription>
              {twoFactorEnabled
                ? 'Two-factor authentication is enabled on your account.'
                : 'Add an authenticator app to require a TOTP code at sign in.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!twoFactorEnabled ? (
              <>
                {!enableTwoFactor.data ? (
                  <form
                    className="flex max-w-md flex-col gap-4"
                    noValidate
                    onSubmit={enableForm.handleSubmit((values) =>
                      enableTwoFactor.mutate(values),
                    )}
                  >
                    <Field
                      data-invalid={
                        enableForm.formState.errors.password ? true : undefined
                      }
                    >
                      <FieldLabel htmlFor="security-enable-2fa-password">
                        Confirm with your password
                      </FieldLabel>
                      <Input
                        aria-invalid={!!enableForm.formState.errors.password}
                        autoComplete="current-password"
                        id="security-enable-2fa-password"
                        type="password"
                        {...enableForm.register('password')}
                      />
                      <FieldError
                        errors={[enableForm.formState.errors.password]}
                      />
                    </Field>

                    <Button loading={enableTwoFactor.isPending} type="submit">
                      Enable two-factor authentication
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-medium">
                        Scan this QR code with your authenticator app
                      </p>
                      <div className="bg-background inline-flex w-fit rounded-lg border p-4">
                        <QRCode
                          size={160}
                          value={withTotpImage(enableTwoFactor.data.totpURI)}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs break-all">
                        {withTotpImage(enableTwoFactor.data.totpURI)}
                      </p>
                    </div>

                    <form
                      className="flex max-w-md flex-col gap-4"
                      noValidate
                      onSubmit={verifyForm.handleSubmit((values) =>
                        verifyTotp.mutate(values),
                      )}
                    >
                      <Field
                        data-invalid={
                          verifyForm.formState.errors.code ? true : undefined
                        }
                      >
                        <FieldLabel htmlFor="security-verify-2fa-code">
                          Verification code
                        </FieldLabel>
                        <Input
                          aria-invalid={!!verifyForm.formState.errors.code}
                          autoComplete="one-time-code"
                          id="security-verify-2fa-code"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          {...verifyForm.register('code')}
                        />
                        <FieldError
                          errors={[verifyForm.formState.errors.code]}
                        />
                      </Field>

                      <Button loading={verifyTotp.isPending} type="submit">
                        Verify and finish setup
                      </Button>
                    </form>

                    {enableTwoFactor.data.backupCodes?.length ? (
                      <div className="bg-muted/40 flex flex-col gap-3 rounded-md border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">Backup codes</p>
                          <CopyToClipboardButton
                            size="sm"
                            text={enableTwoFactor.data.backupCodes.join('\n')}
                            variant="outline"
                          >
                            Copy all codes
                          </CopyToClipboardButton>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Store these one-time recovery codes somewhere safe.
                        </p>
                        <FieldGroup>
                          {enableTwoFactor.data.backupCodes.map((code) => (
                            <code
                              className="bg-background rounded px-2 py-1"
                              key={code}
                            >
                              {code}
                            </code>
                          ))}
                        </FieldGroup>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <form
                className="flex max-w-md flex-col gap-4"
                noValidate
                onSubmit={disableForm.handleSubmit((values) =>
                  disableTwoFactor.mutate(values),
                )}
              >
                <Field
                  data-invalid={
                    disableForm.formState.errors.password ? true : undefined
                  }
                >
                  <FieldLabel htmlFor="security-disable-2fa-password">
                    Confirm with your password
                  </FieldLabel>
                  <Input
                    aria-invalid={!!disableForm.formState.errors.password}
                    autoComplete="current-password"
                    id="security-disable-2fa-password"
                    type="password"
                    {...disableForm.register('password')}
                  />
                  <FieldError
                    errors={[disableForm.formState.errors.password]}
                  />
                </Field>

                <Button
                  loading={disableTwoFactor.isPending}
                  type="submit"
                  variant="destructive"
                  className="self-start"
                >
                  Disable two-factor authentication
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {twoFactorEnabled ? (
          <Card>
            <CardHeader>
              <CardTitle>Backup codes</CardTitle>
              <CardDescription>
                Generate one-time recovery codes in case you lose access to your
                authenticator app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <form
                className="flex max-w-md flex-col gap-4"
                noValidate
                onSubmit={backupCodesForm.handleSubmit((values) =>
                  generateBackupCodes.mutate(values),
                )}
              >
                <Field
                  data-invalid={
                    backupCodesForm.formState.errors.password ? true : undefined
                  }
                >
                  <FieldLabel htmlFor="security-generate-backup-codes-password">
                    Confirm with your password
                  </FieldLabel>
                  <Input
                    aria-invalid={!!backupCodesForm.formState.errors.password}
                    autoComplete="current-password"
                    id="security-generate-backup-codes-password"
                    type="password"
                    {...backupCodesForm.register('password')}
                  />
                  <FieldError
                    errors={[backupCodesForm.formState.errors.password]}
                  />
                </Field>

                <Button
                  loading={generateBackupCodes.isPending}
                  type="submit"
                  className="self-start"
                >
                  Generate backup codes
                </Button>
              </form>

              {generateBackupCodes.data?.length ? (
                <div className="bg-muted/40 flex flex-col gap-3 rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">New backup codes</p>
                    <CopyToClipboardButton
                      size="sm"
                      text={generateBackupCodes.data.join('\n')}
                      variant="outline"
                    >
                      Copy all codes
                    </CopyToClipboardButton>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Save these securely. Your previous backup codes are now
                    invalid.
                  </p>
                  <FieldGroup>
                    {generateBackupCodes.data.map((code) => (
                      <code
                        className="bg-background rounded px-2 py-1"
                        key={code}
                      >
                        {code}
                      </code>
                    ))}
                  </FieldGroup>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </SettingsSection>
  )
}
