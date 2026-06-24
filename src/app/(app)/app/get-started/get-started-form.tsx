'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm, useWatch, useFormState } from 'react-hook-form'
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

const roleOptions = [
  'Developer / Engineer',
  'Designer',
  'Product Manager',
  'Marketing',
  'Founder / CEO',
  'Other',
] as const

const toolsOptions = [
  'Notion',
  'Linear',
  'GitHub',
  'Figma',
  'Vercel',
  'Slack',
] as const

const findUsOptions = [
  'Google search',
  'Social media',
  'Friend or colleague',
  'YouTube',
  'Blog/article',
  'Other',
] as const

const getStartedSchema = z.object({
  role: z.string().trim().min(1, 'Please choose your role.'),
  toolsUsed: z.array(z.string().trim().min(1)).max(50),
  howFoundUs: z.string().trim().min(1, 'Please tell us how you found us.'),
})

type GetStartedFormValues = z.infer<typeof getStartedSchema>

const totalSteps = 3

export function GetStartedForm({
  initialValues,
}: {
  initialValues?: Partial<GetStartedFormValues>
}) {
  const trpc = useTRPC()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const { control, setValue, trigger, handleSubmit } =
    useForm<GetStartedFormValues>({
      resolver: zodResolver(getStartedSchema),
      defaultValues: {
        role: initialValues?.role ?? '',
        toolsUsed: initialValues?.toolsUsed ?? [],
        howFoundUs: initialValues?.howFoundUs ?? '',
      },
    })

  const { errors } = useFormState({ control })
  const selectedRole = useWatch({ control, name: 'role' })
  const selectedTools = useWatch({ control, name: 'toolsUsed' })
  const selectedHowFoundUs = useWatch({ control, name: 'howFoundUs' })

  const submitOnboarding = useMutation(
    trpc.onboarding.submit.mutationOptions({
      onSuccess: () => {
        router.push('/app')
        router.refresh()
      },
      onError: (error) => {
        showErrorToast('Could not finish onboarding.', error)
      },
    }),
  )

  const progressPercent = useMemo(
    () => Math.round((step / totalSteps) * 100),
    [step],
  )

  const canContinue =
    step === 1
      ? Boolean(selectedRole)
      : step === 3
        ? Boolean(selectedHowFoundUs)
        : true

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-2 text-center">
        <div className="mx-auto mb-1 w-full max-w-36">
          <div className="bg-muted h-2 w-full rounded-full">
            <div
              className="bg-primary h-1 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Step {step} of {totalSteps}
          </p>
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {step === 1
            ? 'What best describes your role?'
            : step === 2
              ? 'What tools have you already used?'
              : 'How did you find us?'}
        </CardTitle>
        <CardDescription>
          {step === 2
            ? 'This question is optional. You can skip it for now.'
            : 'This helps us personalize your experience.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => submitOnboarding.mutate(values))}
        >
          <FieldGroup>
            {step === 1 ? (
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Field data-invalid={errors.role ? 'true' : undefined}>
                    <FieldLabel>Your role</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={
                            field.value === option ? 'default' : 'outline'
                          }
                          className="h-auto min-h-10 justify-start text-left"
                          onClick={() => field.onChange(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    <FieldError errors={[errors.role]} />
                  </Field>
                )}
              />
            ) : null}

            {step === 2 ? (
              <Controller
                control={control}
                name="toolsUsed"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Tools used (optional)</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {toolsOptions.map((tool) => {
                        const active = field.value.includes(tool)
                        return (
                          <Button
                            key={tool}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            className="h-auto min-h-10 justify-start text-left"
                            onClick={() => {
                              const next = active
                                ? field.value.filter((value) => value !== tool)
                                : [...field.value, tool]
                              field.onChange(next)
                            }}
                          >
                            {tool}
                          </Button>
                        )
                      })}
                    </div>
                  </Field>
                )}
              />
            ) : null}

            {step === 3 ? (
              <Controller
                control={control}
                name="howFoundUs"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid ? 'true' : undefined}>
                    <FieldLabel htmlFor="how-found-us">
                      How did you find us?
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      {' '}
                      <SelectTrigger className="w-full" id="how-found-us">
                        <SelectValue placeholder="Choose one option" />
                      </SelectTrigger>
                      <SelectContent>
                        {findUsOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            ) : null}
          </FieldGroup>

          <CardFooter className="border-0 bg-transparent px-0">
            <div className="flex w-full items-center gap-2">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                >
                  Back
                </Button>
              ) : null}

              {step === 2 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(3)}
                  className="ml-auto"
                >
                  Skip for now
                </Button>
              ) : null}

              {step < totalSteps ? (
                <Button
                  type="button"
                  className={step === 2 ? '' : 'ml-auto'}
                  disabled={!canContinue}
                  onClick={async () => {
                    if (step === 1) {
                      const valid = await trigger('role')
                      if (!valid) {
                        return
                      }
                    }

                    if (step === 2) {
                      setValue('toolsUsed', selectedTools ?? [])
                    }

                    setStep((current) => Math.min(totalSteps, current + 1))
                  }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="ml-auto"
                  loading={submitOnboarding.isPending}
                >
                  Finish setup
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
