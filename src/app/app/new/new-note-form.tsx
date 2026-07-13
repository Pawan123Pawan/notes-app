'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText, Upload } from 'lucide-react'
import { useRef } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { parseTranscriptFileContent } from '@/lib/transcript-file'
import { showErrorToast } from '@/lib/utils'
import { createNoteInput } from '@/trpc/routers/notes/notes.input'
import { useTRPC } from '@/trpc/react'

const newNoteTabs = ['transcript', 'youtube'] as const
type NewNoteTab = (typeof newNoteTabs)[number]

const acceptedTranscriptTypes = '.txt,.md,.srt,.vtt,text/plain'

type NewNoteFormValues = {
  transcript: string
  url: string
  subjectId: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeTab = parseNewNoteTab(searchParams.get('tab'))
  const initialSubjectId = searchParams.get('subjectId') ?? 'none'

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const form = useForm<NewNoteFormValues>({
    defaultValues: {
      transcript: '',
      url: '',
      subjectId: initialSubjectId,
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
    const subjectId = values.subjectId === 'none' ? undefined : values.subjectId

    const input =
      activeTab === 'transcript'
        ? createNoteInput.safeParse({
            sourceType: 'transcript',
            transcript: values.transcript,
            subjectId,
          })
        : createNoteInput.safeParse({
            sourceType: 'youtube',
            url: values.url,
            subjectId,
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const content = await file.text()
      const transcript = parseTranscriptFileContent(file.name, content)
      form.setValue('transcript', transcript, { shouldValidate: true })
      form.clearErrors('transcript')
    } catch (error) {
      showErrorToast(
        'Could not read file',
        error,
        'Unable to read the transcript file.',
      )
    } finally {
      event.target.value = ''
    }
  }

  const subjects = subjectsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create study notes</CardTitle>
        <CardDescription>
          Upload a transcript file or paste a YouTube URL. We will structure the
          content and save your notebook to your account.
        </CardDescription>
      </CardHeader>
      <form noValidate onSubmit={submitNote}>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Controller
              name="subjectId"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="new-note-subject">Subject</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="new-note-subject"
                      className="w-full sm:w-72"
                    >
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subject</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Optional folder for organizing this note.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <Tabs value={activeTab}>
            <TabsList>
              <TabsTrigger asChild value="transcript">
                <Link href={tabHref('transcript')}>Transcript file</Link>
              </TabsTrigger>
              <TabsTrigger asChild value="youtube">
                <Link href={tabHref('youtube')}>YouTube URL</Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-4 space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="new-note-file">
                    Upload transcript
                  </FieldLabel>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileInputRef}
                      id="new-note-file"
                      type="file"
                      accept={acceptedTranscriptTypes}
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload />
                      Choose file
                    </Button>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <FileText className="size-4" />
                      .txt, .md, .srt, or .vtt
                    </p>
                  </div>
                  <FieldDescription>
                    Upload a transcript file or paste the text below.
                  </FieldDescription>
                </Field>

                <Controller
                  name="transcript"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-note-transcript">
                        Transcript text
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="new-note-transcript"
                        placeholder="Paste transcript text here, or upload a file above..."
                        rows={14}
                        aria-invalid={fieldState.invalid}
                      />
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
                        We fetch available captions from the video, then
                        generate structured notes and a handwritten notebook.
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
          >
            Generate notes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
