'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import * as z from 'zod'

import { SettingsSection } from './settings-section'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { authClient, authPublicUrl } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : ''
  return { firstName, lastName }
}

function initialsFromName(first: string, last: string) {
  const a = first.charAt(0)
  const b = last.charAt(0) || first.charAt(1)
  return (a + b).toUpperCase() || '?'
}

function timeZoneOptions(): string[] {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    return Intl.supportedValuesOf('timeZone')
  }
  return [
    'UTC',
    'America/Los_Angeles',
    'America/New_York',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
  ]
}

function appHostForUsername(): string {
  const raw = authPublicUrl
  try {
    return `${new URL(raw).host}/`
  } catch {
    return 'localhost/'
  }
}

const personalSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name'),
  lastName: z.string().trim().optional(),
  email: z.email('Enter a valid email'),
  username: z
    .string()
    .trim()
    .max(64, 'Username is too long')
    .refine(
      (v) => v === '' || /^[a-zA-Z0-9_-]{2,64}$/.test(v),
      'Use 2–64 characters: letters, numbers, underscores, or hyphens',
    ),
  timezone: z.string().min(1, 'Select a timezone'),
})

type PersonalValues = z.infer<typeof personalSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordValues = z.infer<typeof passwordSchema>

const deleteSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm'),
})

type DeleteValues = z.infer<typeof deleteSchema>

type UploadAvatarResponse = {
  url: string
  pathname: string
  contentType: string
  downloadUrl: string
}

export function AccountSettings() {
  const router = useRouter()
  const {
    data: session,
    isPending: sessionPending,
    refetch: refetchSession,
  } = authClient.useSession()
  const user = session?.user

  const [avatarDraft, setAvatarDraft] = useState<UploadAvatarResponse | null>(
    null,
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tzList = useMemo(() => {
    const base = timeZoneOptions()
    const extra = user as Record<string, unknown> | undefined
    const tz =
      typeof extra?.timezone === 'string' && extra.timezone
        ? extra.timezone
        : null
    if (tz && !base.includes(tz)) {
      return [tz, ...base]
    }
    return base
  }, [user])

  const personalDefaults = useMemo((): PersonalValues => {
    if (!user) {
      return {
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        timezone: 'America/Los_Angeles',
      }
    }
    const { firstName, lastName } = splitName(user.name ?? '')
    const extra = user as Record<string, unknown>
    return {
      firstName,
      lastName,
      email: user.email ?? '',
      username: typeof extra.username === 'string' ? extra.username : '',
      timezone:
        typeof extra.timezone === 'string' && extra.timezone
          ? extra.timezone
          : 'America/Los_Angeles',
    }
  }, [user])

  const emptyPersonal = useMemo(
    (): PersonalValues => ({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      timezone: 'America/Los_Angeles',
    }),
    [],
  )

  const personalForm = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: emptyPersonal,
    values: user ? personalDefaults : emptyPersonal,
  })

  const updateProfile = useMutation({
    mutationFn: async (values: PersonalValues) => {
      const name =
        `${values.firstName.trim()} ${values.lastName?.trim() ?? ''}`.trim()
      const image =
        avatarDraft?.url ??
        (typeof user?.image === 'string' ? user.image : null)
      const { error } = await authClient.updateUser({
        name,
        image: image ?? undefined,
        // Better Auth additional fields (see `user.additionalFields` in `auth.ts`)
        username: values.username.trim() === '' ? null : values.username.trim(),
        timezone: values.timezone,
      } as {
        name: string
        image?: string | null
        username?: string | null
        timezone?: string
      })
      if (error) {
        throw new Error(error.message ?? 'Could not update profile.')
      }
    },
    onSuccess: async () => {
      setAvatarDraft(null)
      await refetchSession()
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not update profile.', error)
    },
  })

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/uploads/profile-picture', {
        method: 'POST',
        body: formData,
      })
      const data = (await response.json()) as
        | UploadAvatarResponse
        | { error?: string }

      if (!response.ok) {
        throw new Error(
          'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Could not upload profile image.',
        )
      }

      return data as UploadAvatarResponse
    },
    onSuccess: (data) => {
      setAvatarDraft(data)
    },
    onError: (error) => {
      showErrorToast('Could not upload profile image.', error)
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const changePassword = useMutation({
    mutationFn: async (values: PasswordValues) => {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: false,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not change password.')
      }
    },
    onSuccess: () => {
      passwordForm.reset()
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not change password.', error)
    },
  })

  const deleteForm = useForm<DeleteValues>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { password: '' },
  })

  const deleteAccount = useMutation({
    mutationFn: async (values: DeleteValues) => {
      const { error } = await authClient.deleteUser({
        password: values.password,
        callbackURL: `${authPublicUrl}/`,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not delete account.')
      }
    },
    onSuccess: async () => {
      setIsDeleteDialogOpen(false)
      await authClient.signOut()
      router.push('/')
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not delete account.', error)
    },
  })

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const okTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!okTypes.includes(file.type)) {
      personalForm.setError('root', {
        message: 'Use a JPG, GIF, or PNG image.',
      })
      return
    }
    if (file.size > 1024 * 1024) {
      personalForm.setError('root', {
        message: 'Image must be 1MB or smaller.',
      })
      return
    }
    personalForm.clearErrors('root')
    uploadAvatar.mutate(file)
    e.target.value = ''
  }

  const displayImage = avatarDraft?.url ?? user?.image ?? null
  const previewName =
    useWatch({ control: personalForm.control, name: 'firstName' }) ?? ''
  const previewLast =
    useWatch({ control: personalForm.control, name: 'lastName' }) ?? ''

  if (sessionPending || !user) {
    return (
      <p className="text-muted-foreground text-sm">Loading account settings…</p>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <SettingsSection
        description="Update your photo and personal details here."
        title="Personal information"
      >
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={personalForm.handleSubmit((values) => {
            personalForm.clearErrors('root')
            updateProfile.mutate(values)
          })}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col gap-3">
              {displayImage ? (
                // Avatar URLs may come from external blob storage; next/image is not used.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-20 rounded-lg object-cover"
                  height={80}
                  src={displayImage}
                  width={80}
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-lg text-sm font-medium">
                  {initialsFromName(previewName, previewLast)}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <input
                accept="image/jpeg,image/png,image/gif"
                className="sr-only"
                onChange={onAvatarFileChange}
                ref={fileInputRef}
                type="file"
              />
              <Button
                loading={uploadAvatar.isPending}
                onClick={() => fileInputRef.current?.click()}
                type="button"
                variant="outline"
              >
                Change avatar
              </Button>
              <p className="text-muted-foreground text-xs">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                data-invalid={
                  personalForm.formState.errors.firstName ? true : undefined
                }
              >
                <FieldLabel htmlFor="settings-first-name">
                  First name
                </FieldLabel>
                <Input
                  aria-invalid={!!personalForm.formState.errors.firstName}
                  autoComplete="given-name"
                  id="settings-first-name"
                  {...personalForm.register('firstName')}
                />
                <FieldError
                  errors={[personalForm.formState.errors.firstName]}
                />
              </Field>
              <Field
                data-invalid={
                  personalForm.formState.errors.lastName ? true : undefined
                }
              >
                <FieldLabel htmlFor="settings-last-name">Last name</FieldLabel>
                <Input
                  aria-invalid={!!personalForm.formState.errors.lastName}
                  autoComplete="family-name"
                  id="settings-last-name"
                  {...personalForm.register('lastName')}
                />
                <FieldError errors={[personalForm.formState.errors.lastName]} />
              </Field>
            </div>

            <Field
              data-invalid={
                personalForm.formState.errors.email ? true : undefined
              }
            >
              <FieldLabel htmlFor="settings-email">Email address</FieldLabel>
              <Input
                aria-invalid={!!personalForm.formState.errors.email}
                autoComplete="email"
                id="settings-email"
                readOnly
                {...personalForm.register('email')}
                className="bg-muted/50"
              />
              <FieldDescription>
                Email is managed at sign-up. Contact support if you need to
                change it.
              </FieldDescription>
              <FieldError errors={[personalForm.formState.errors.email]} />
            </Field>

            <Field
              data-invalid={
                personalForm.formState.errors.username ? true : undefined
              }
            >
              <FieldLabel htmlFor="settings-username">Username</FieldLabel>
              <div className="border-input has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-ring/50 dark:bg-input/30 flex w-full min-w-0 rounded-lg border outline-none has-[input:focus-visible]:ring-3">
                <span className="text-muted-foreground border-input flex shrink-0 items-center border-r px-2.5 text-sm">
                  {appHostForUsername()}
                </span>
                <Input
                  aria-invalid={!!personalForm.formState.errors.username}
                  autoComplete="username"
                  className="border-0 shadow-none focus-visible:ring-0"
                  id="settings-username"
                  placeholder="janesmith"
                  {...personalForm.register('username')}
                />
              </div>
              <FieldError errors={[personalForm.formState.errors.username]} />
            </Field>

            <Field
              data-invalid={
                personalForm.formState.errors.timezone ? true : undefined
              }
            >
              <FieldLabel htmlFor="settings-timezone">Timezone</FieldLabel>
              <Controller
                control={personalForm.control}
                name="timezone"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      aria-invalid={!!personalForm.formState.errors.timezone}
                      className="w-full min-w-0"
                      id="settings-timezone"
                    >
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {tzList.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[personalForm.formState.errors.timezone]} />
            </Field>
          </FieldGroup>

          {personalForm.formState.errors.root?.message ? (
            <FieldError>
              {personalForm.formState.errors.root.message}
            </FieldError>
          ) : null}
          {updateProfile.isError ? (
            <FieldError>
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : 'Something went wrong.'}
            </FieldError>
          ) : null}
          {uploadAvatar.isError ? (
            <FieldError>
              {uploadAvatar.error instanceof Error
                ? uploadAvatar.error.message
                : 'Could not upload profile image.'}
            </FieldError>
          ) : null}

          <Button
            loading={updateProfile.isPending}
            type="submit"
            className="self-start"
          >
            Save changes
          </Button>
        </form>
      </SettingsSection>

      <Separator />

      <SettingsSection
        description="Change your password to keep your account secure."
        title="Update password"
      >
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={passwordForm.handleSubmit((values) =>
            changePassword.mutate(values),
          )}
        >
          <FieldGroup>
            <Field
              data-invalid={
                passwordForm.formState.errors.currentPassword ? true : undefined
              }
            >
              <FieldLabel htmlFor="settings-current-password">
                Current password
              </FieldLabel>
              <Input
                aria-invalid={!!passwordForm.formState.errors.currentPassword}
                autoComplete="current-password"
                id="settings-current-password"
                type="password"
                {...passwordForm.register('currentPassword')}
              />
              <FieldError
                errors={[passwordForm.formState.errors.currentPassword]}
              />
            </Field>
            <Field
              data-invalid={
                passwordForm.formState.errors.newPassword ? true : undefined
              }
            >
              <FieldLabel htmlFor="settings-new-password">
                New password
              </FieldLabel>
              <Input
                aria-invalid={!!passwordForm.formState.errors.newPassword}
                autoComplete="new-password"
                id="settings-new-password"
                type="password"
                {...passwordForm.register('newPassword')}
              />
              <FieldError
                errors={[passwordForm.formState.errors.newPassword]}
              />
            </Field>
            <Field
              data-invalid={
                passwordForm.formState.errors.confirmPassword ? true : undefined
              }
            >
              <FieldLabel htmlFor="settings-confirm-password">
                Confirm password
              </FieldLabel>
              <Input
                aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                autoComplete="new-password"
                id="settings-confirm-password"
                type="password"
                {...passwordForm.register('confirmPassword')}
              />
              <FieldError
                errors={[passwordForm.formState.errors.confirmPassword]}
              />
            </Field>
          </FieldGroup>

          {changePassword.isError ? (
            <FieldError>
              {changePassword.error instanceof Error
                ? changePassword.error.message
                : 'Something went wrong.'}
            </FieldError>
          ) : null}

          <Button
            loading={changePassword.isPending}
            type="submit"
            className="self-start"
          >
            Update password
          </Button>
        </form>
      </SettingsSection>

      <Separator />

      <SettingsSection
        description="Permanently remove your account and all associated data. This action cannot be undone."
        title="Delete account"
      >
        <form className="flex max-w-md flex-col gap-5" noValidate>
          <Field
            data-invalid={
              deleteForm.formState.errors.password ? true : undefined
            }
          >
            <FieldLabel htmlFor="settings-delete-password">
              Confirm with your password
            </FieldLabel>
            <Input
              aria-invalid={!!deleteForm.formState.errors.password}
              autoComplete="current-password"
              id="settings-delete-password"
              type="password"
              {...deleteForm.register('password')}
            />
            <FieldError errors={[deleteForm.formState.errors.password]} />
          </Field>

          {deleteAccount.isError ? (
            <FieldError>
              {deleteAccount.error instanceof Error
                ? deleteAccount.error.message
                : 'Something went wrong.'}
            </FieldError>
          ) : null}

          <AlertDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                className="w-fit"
                loading={deleteAccount.isPending}
                type="button"
                variant="destructive"
              >
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent and removes your account and all
                  associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteAccount.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteAccount.isPending}
                  onClick={(event) => {
                    event.preventDefault()
                    void deleteForm.handleSubmit((values) => {
                      deleteAccount.mutate(values)
                    })()
                  }}
                  variant="destructive"
                >
                  {deleteAccount.isPending ? 'Deleting...' : 'Delete account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </SettingsSection>
    </div>
  )
}
