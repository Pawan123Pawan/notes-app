'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
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
import { Textarea } from '@/components/ui/textarea'
import { showErrorToast } from '@/lib/utils'
import { BadgeCheckIcon } from 'lucide-react'

const teamSizeValues = [
  '1',
  '2-10',
  '11-50',
  '51-200',
  '201-1000',
  '1000+',
] as const

const joinWaitlistSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name'),
  email: z.email('Enter a valid email'),
  companyName: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  teamSize: z.enum(teamSizeValues).optional(),
  useCase: z.string(),
  consentToMarketing: z.boolean().optional(),
})

type JoinWaitlistFormValues = z.infer<typeof joinWaitlistSchema>

type JoinWaitlistDialogProps = {
  trigger: ReactNode
}

export function JoinWaitlistDialog({ trigger }: JoinWaitlistDialogProps) {
  const [open, setOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinWaitlistFormValues>({
    resolver: zodResolver(joinWaitlistSchema),
    defaultValues: {
      fullName: '',
      email: '',
      companyName: '',
      jobTitle: '',
      teamSize: undefined,
      useCase: '',
      consentToMarketing: false,
    },
  })

  const joinWaitlist = useMutation({
    mutationFn: async (values: JoinWaitlistFormValues) => {
      const response = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as
          | { errors?: Array<{ message?: string }> }
          | undefined
        const message =
          responseBody?.errors?.[0]?.message ??
          'Could not submit waitlist form.'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      reset()
    },
    onError: (error) => {
      showErrorToast('Waitlist signup failed.', error)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          {joinWaitlist.status !== 'success' && (
            <>
              <DialogTitle>Join the waitlist</DialogTitle>
              <DialogDescription>
                Tell us about yourself and what you are building. We will
                prioritize invites based on fit and use case.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {joinWaitlist.status === 'success' ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <BadgeCheckIcon
              className="size-10 fill-olive-950 stroke-white dark:fill-olive-300 dark:stroke-olive-950"
              strokeWidth={1.5}
            />
            <div className="text-center text-olive-700 dark:text-olive-400">
              Thanks, you are on the waitlist. We will reach out soon.
            </div>
          </div>
        ) : (
          <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              joinWaitlist.mutate(values)
            })}
          >
            <FieldGroup>
              <Field data-invalid={errors.fullName ? 'true' : undefined}>
                <FieldLabel htmlFor="waitlist-fullName">Full name</FieldLabel>
                <Input
                  id="waitlist-fullName"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  aria-invalid={!!errors.fullName}
                  {...register('fullName')}
                />
                <FieldError errors={[errors.fullName]} />
              </Field>

              <Field data-invalid={errors.email ? 'true' : undefined}>
                <FieldLabel htmlFor="waitlist-email">Email</FieldLabel>
                <Input
                  id="waitlist-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={errors.companyName ? 'true' : undefined}>
                <FieldLabel htmlFor="waitlist-companyName">
                  Company name
                </FieldLabel>
                <Input
                  id="waitlist-companyName"
                  placeholder="Acme Inc."
                  aria-invalid={!!errors.companyName}
                  {...register('companyName')}
                />
                <FieldError errors={[errors.companyName]} />
              </Field>

              <Field data-invalid={errors.jobTitle ? 'true' : undefined}>
                <FieldLabel htmlFor="waitlist-jobTitle">Job title</FieldLabel>
                <Input
                  id="waitlist-jobTitle"
                  placeholder="Founder"
                  aria-invalid={!!errors.jobTitle}
                  {...register('jobTitle')}
                />
                <FieldError errors={[errors.jobTitle]} />
              </Field>

              <Field data-invalid={errors.teamSize ? 'true' : undefined}>
                <FieldLabel htmlFor="waitlist-teamSize">Team size</FieldLabel>
                <Controller
                  name="teamSize"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="waitlist-teamSize"
                        aria-invalid={!!errors.teamSize}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Just me</SelectItem>
                        <SelectItem value="2-10">2-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-1000">201-1000</SelectItem>
                        <SelectItem value="1000+">1000+</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.teamSize]} />
              </Field>

              <Field data-invalid={errors.useCase ? 'true' : undefined}>
                <FieldLabel htmlFor="waitlist-useCase">
                  What are you planning to build?
                </FieldLabel>
                <Textarea
                  id="waitlist-useCase"
                  placeholder="A 1-2 sentence summary of your product and why you need this."
                  aria-invalid={!!errors.useCase}
                  {...register('useCase')}
                />
                <FieldError errors={[errors.useCase]} />
              </Field>

              <Field>
                <label
                  htmlFor="waitlist-consentToMarketing"
                  className="flex items-start gap-2 text-sm"
                >
                  <Controller
                    name="consentToMarketing"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="waitlist-consentToMarketing"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    )}
                  />
                  <span>Send me product updates and launch announcements.</span>
                </label>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                loading={joinWaitlist.isPending}
              >
                Join waitlist
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
