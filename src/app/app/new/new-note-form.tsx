'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { createNoteInput } from '@/trpc/routers/notes/notes.input'
import { useTRPC } from '@/trpc/react'

const newNoteTabs = ['transcript', 'youtube'] as const
type NewNoteTab = (typeof newNoteTabs)[number]

type NewNoteFormValues = {
  transcript: string
  url: string
}

function parseNewNoteTab(value: string | null): NewNoteTab {
  if (value === 'youtube') {
    return 'youtube'
  }

  return 'transcript'
}

function tabHref(tab: NewNoteTab) {
  return tab === 'transcript' ? '/app/new' : `/app/new?tab=${tab}`
}

export function NewNoteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const activeTab = parseNewNoteTab(searchParams.get('tab'))

  const form = useForm<NewNoteFormValues>({
    defaultValues: {
      transcript: '',
      url: '',
    },
  })

  const createMutation = useMutation(
    trpc.notes.create.mutationOptions({
      onSuccess: (data) => {
        const href = `/app/notes/${data.id}`
        triggerRouteProgressStart(href)
        router.push(href)
      },
      onError: (error) => {
        showErrorToast(
          'Could not create note',
          error,
          'Unable to create your note.',
        )
      },
    }),
  )

  const submitNote = form.handleSubmit((values) => {
    const input =
      activeTab === 'transcript'
        ? createNoteInput.safeParse({
            sourceType: 'transcript',
            transcript: values.transcript,
          })
        : createNoteInput.safeParse({
            sourceType: 'youtube',
            url: values.url,
          })

    if (!input.success) {
      for (const issue of input.error.issues) {
        const field = issue.path[0]

        if (field === 'transcript' || field === 'url') {
          form.setError(field, { message: issue.message })
        }
      }

      return
    }

    createMutation.mutate(input.data)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create from source</CardTitle>
        <CardDescription>
          Choose how you want to provide content for your note.
        </CardDescription>
      </CardHeader>
      <form noValidate onSubmit={submitNote}>
        <CardContent className="space-y-6">
          <Tabs value={activeTab}>
            <TabsList>
              <TabsTrigger asChild value="transcript">
                <Link href={tabHref('transcript')}>Paste transcript</Link>
              </TabsTrigger>
              <TabsTrigger asChild value="youtube">
                <Link href={tabHref('youtube')}>YouTube URL</Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-4">
              <FieldGroup>
                <Controller
                  name="transcript"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-note-transcript">
                        Transcript
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="new-note-transcript"
                        placeholder="Paste the full transcript here..."
                        rows={14}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Include the full spoken content. Filler words are fine —
                        we will structure them into study notes.
                      </FieldDescription>
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </FieldGroup>
            </TabsContent>

            <TabsContent value="youtube" className="mt-4">
              <FieldGroup>
                <Controller
                  name="url"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-note-url">
                        YouTube URL
                      </FieldLabel>
                      <Input
                        {...field}
                        id="new-note-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        YouTube import is coming soon. For now, paste the
                        transcript manually on the other tab.
                      </FieldDescription>
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </FieldGroup>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            loading={createMutation.isPending}
            disabled={activeTab === 'youtube'}
          >
            {activeTab === 'transcript' ? 'Create note' : 'Coming soon'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
