'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCode2Icon, FileTextIcon, PlusIcon, UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { GeneratingNotebookState } from '@/app/app/notes/[noteId]/generating-notebook-state'
import {
  extractHtmlTitle,
  parseNotebookHtmlFile,
} from '@/lib/notebook-html-file'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { parseTranscriptFileContent } from '@/lib/transcript-file'
import { showErrorToast } from '@/lib/utils'
import { createNoteInput } from '@/trpc/routers/notes/notes.input'
import { createSubjectInput } from '@/trpc/routers/subjects/subjects.input'
import { useTRPC } from '@/trpc/react'

type NewNoteTab = 'transcript' | 'youtube' | 'html'

const acceptedTranscriptTypes = '.txt,.md,.srt,.vtt,text/plain'
const acceptedHtmlTypes = '.html,.htm,text/html'

type NewNoteFormValues = {
  transcript: string
  url: string
  mcqCount: string
  notebookHtml: string
  htmlTitle: string
  htmlFileName: string
  subjectId: string
  folderId: string
}

type CreateSubjectFormValues = {
  name: string
}

const tabMeanings: Record<NewNoteTab, { title: string; description: string }> =
  {
    transcript: {
      title: 'Create notes from a transcript',
      description:
        'Use lecture or class text. Upload a file or paste the transcript, and we turn it into structured study notes and a notebook for that topic.',
    },
    youtube: {
      title: 'Create notes from a YouTube video',
      description:
        'Paste a video link. We read available captions, then build structured study notes and a notebook about the topic covered in the video.',
    },
    html: {
      title: 'Save an existing HTML notebook',
      description:
        'Already have finished notes as HTML? Upload a file or paste the HTML to save it as a notebook. Nothing is generated—your content is stored as-is.',
    },
  }

function parseNewNoteTab(value: string | null): NewNoteTab {
  if (value === 'youtube' || value === 'html') {
    return value
  }

  return 'transcript'
}

function tabHref(
  tab: NewNoteTab,
  subjectId: string | null,
  folderId: string | null,
) {
  const params = new URLSearchParams()

  if (tab !== 'transcript') {
    params.set('tab', tab)
  }

  if (subjectId) {
    params.set('subjectId', subjectId)
  }

  if (subjectId && folderId && folderId !== 'root') {
    params.set('folderId', folderId)
  }

  const query = params.toString()
  return query ? `/app/new?${query}` : '/app/new'
}

export function NewNoteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const transcriptFileInputRef = useRef<HTMLInputElement>(null)
  const htmlFileInputRef = useRef<HTMLInputElement>(null)
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false)
  const [completedNoteId, setCompletedNoteId] = useState<string | null>(null)
  const [completedNoteKind, setCompletedNoteKind] = useState<
    'generated' | 'imported'
  >('generated')
  const activeTab = parseNewNoteTab(searchParams.get('tab'))
  const initialSubjectId = searchParams.get('subjectId') ?? ''
  const initialFolderId = searchParams.get('folderId') ?? 'root'

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const form = useForm<NewNoteFormValues>({
    defaultValues: {
      transcript: '',
      url: '',
      mcqCount: '',
      notebookHtml: '',
      htmlTitle: '',
      htmlFileName: '',
      subjectId: initialSubjectId,
      folderId: initialFolderId,
    },
  })

  const createSubjectForm = useForm<CreateSubjectFormValues>({
    defaultValues: { name: '' },
  })

  const htmlFileName = useWatch({
    control: form.control,
    name: 'htmlFileName',
  })

  const selectedSubjectId = useWatch({
    control: form.control,
    name: 'subjectId',
  })

  const selectedFolderId = useWatch({
    control: form.control,
    name: 'folderId',
  })

  const foldersQuery = useQuery({
    ...trpc.folders.listTree.queryOptions({
      subjectId: selectedSubjectId,
    }),
    enabled: Boolean(selectedSubjectId),
  })

  const createMutation = useMutation(
    trpc.notes.create.mutationOptions({
      onSuccess: async (data, variables) => {
        setCompletedNoteId(data.id)
        setCompletedNoteKind(
          variables.sourceType === 'html' ? 'imported' : 'generated',
        )
        await queryClient.invalidateQueries({
          queryKey: trpc.notes.list.queryKey(),
        })
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

  const createSubjectMutation = useMutation(
    trpc.subjects.create.mutationOptions({
      onSuccess: async (subject) => {
        queryClient.setQueryData(trpc.subjects.list.queryKey(), (previous) => {
          const subjects = previous ?? []
          if (subjects.some((item) => item.id === subject.id)) {
            return subjects
          }

          return [...subjects, subject].sort((a, b) =>
            a.name.localeCompare(b.name),
          )
        })
        form.setValue('subjectId', subject.id)
        form.setValue('folderId', 'root')
        createSubjectForm.reset()
        setCreateSubjectOpen(false)
        toast.success('Subject created')
        await queryClient.invalidateQueries({
          queryKey: trpc.subjects.list.queryKey(),
        })
      },
      onError: (error) => {
        showErrorToast(
          'Could not create subject',
          error,
          'Unable to create this subject.',
        )
      },
    }),
  )

  const submitNote = form.handleSubmit((values) => {
    const folderId = values.folderId !== 'root' ? values.folderId : undefined

    const input =
      activeTab === 'transcript'
        ? createNoteInput.safeParse({
            sourceType: 'transcript',
            transcript: values.transcript,
            mcqCount: values.mcqCount,
            subjectId: values.subjectId,
            folderId,
          })
        : activeTab === 'youtube'
          ? createNoteInput.safeParse({
              sourceType: 'youtube',
              url: values.url,
              mcqCount: values.mcqCount,
              subjectId: values.subjectId,
              folderId,
            })
          : createNoteInput.safeParse({
              sourceType: 'html',
              notebookHtml: values.notebookHtml,
              title:
                values.htmlTitle.trim() ||
                extractHtmlTitle(values.notebookHtml) ||
                undefined,
              subjectId: values.subjectId,
              folderId,
            })

    if (!input.success) {
      for (const issue of input.error.issues) {
        const field = issue.path[0]

        if (
          field === 'transcript' ||
          field === 'url' ||
          field === 'mcqCount' ||
          field === 'subjectId'
        ) {
          form.setError(field, { message: issue.message })
        }

        if (field === 'notebookHtml') {
          form.setError('notebookHtml', { message: issue.message })
        }
      }

      return
    }

    createMutation.mutate(input.data)
  })

  const handleTranscriptFileChange = async (
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

  const handleHtmlFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const content = await file.text()
      const parsed = parseNotebookHtmlFile(file.name, content)
      form.setValue('notebookHtml', parsed.notebookHtml, {
        shouldValidate: true,
      })
      form.setValue('htmlTitle', parsed.title)
      form.setValue('htmlFileName', file.name)
      form.clearErrors('notebookHtml')
    } catch (error) {
      showErrorToast(
        'Could not read HTML file',
        error,
        'Unable to read the HTML notebook file.',
      )
    } finally {
      event.target.value = ''
    }
  }

  const submitCreateSubject = createSubjectForm.handleSubmit((values) => {
    const input = createSubjectInput.safeParse(values)

    if (!input.success) {
      for (const issue of input.error.issues) {
        if (issue.path[0] === 'name') {
          createSubjectForm.setError('name', { message: issue.message })
        }
      }

      return
    }

    createSubjectMutation.mutate(input.data)
  })

  const subjects = subjectsQuery.data ?? []
  const folders = foldersQuery.data ?? []
  const subjectIdForLinks = selectedSubjectId || null
  const folderIdForLinks = selectedFolderId === 'root' ? null : selectedFolderId
  const isGenerating = createMutation.isPending && activeTab !== 'html'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create study notes</CardTitle>
          <CardDescription>
            Pick how you want to add a note: from a transcript, a YouTube video,
            or an existing HTML notebook. Each option creates a note about that
            topic you can review later.
          </CardDescription>
        </CardHeader>
        {completedNoteId ? (
          <CardContent className="border-b">
            <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                {completedNoteKind === 'imported'
                  ? 'Notebook saved successfully'
                  : 'Notes generated successfully'}
              </p>
              <p className="text-muted-foreground text-sm">
                {completedNoteKind === 'imported'
                  ? 'Your HTML notebook is ready to view.'
                  : 'Your bilingual revision notes are ready to view.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    const href = `/app/notes/${completedNoteId}`
                    triggerRouteProgressStart(href)
                    router.push(href)
                  }}
                >
                  View notes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompletedNoteId(null)}
                >
                  Create another note
                </Button>
              </div>
            </div>
          </CardContent>
        ) : null}
        {isGenerating ? (
          <CardContent>
            <GeneratingNotebookState />
          </CardContent>
        ) : (
          <form noValidate onSubmit={submitNote}>
            <CardContent className="space-y-6">
              <FieldGroup>
                <Controller
                  name="subjectId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-note-subject">
                        Subject
                      </FieldLabel>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.setValue('folderId', 'root')
                            form.clearErrors('subjectId')
                          }}
                        >
                          <SelectTrigger
                            id="new-note-subject"
                            className="w-full sm:w-72"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="Choose a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateSubjectOpen(true)}
                        >
                          <PlusIcon />
                          New subject
                        </Button>
                      </div>
                      <FieldDescription>
                        Required. Create a subject if it does not exist yet.
                      </FieldDescription>
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />

                {selectedSubjectId ? (
                  <Controller
                    name="folderId"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="new-note-folder">
                          Folder
                        </FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={foldersQuery.isLoading}
                        >
                          <SelectTrigger
                            id="new-note-folder"
                            className="w-full sm:w-72"
                          >
                            <SelectValue placeholder="Choose a folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="root">Subject root</SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Optional folder inside the subject. Leave at subject
                          root if you are not nesting this note.
                        </FieldDescription>
                      </Field>
                    )}
                  />
                ) : null}
              </FieldGroup>

              <Tabs value={activeTab}>
                <TabsList>
                  <TabsTrigger asChild value="transcript">
                    <Link
                      href={tabHref(
                        'transcript',
                        subjectIdForLinks,
                        folderIdForLinks,
                      )}
                    >
                      Transcript
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger asChild value="youtube">
                    <Link
                      href={tabHref(
                        'youtube',
                        subjectIdForLinks,
                        folderIdForLinks,
                      )}
                    >
                      YouTube
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger asChild value="html">
                    <Link
                      href={tabHref(
                        'html',
                        subjectIdForLinks,
                        folderIdForLinks,
                      )}
                    >
                      HTML
                    </Link>
                  </TabsTrigger>
                </TabsList>

                <div className="bg-muted/40 mt-4 rounded-lg border p-4">
                  <p className="text-sm font-medium">
                    {tabMeanings[activeTab].title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {tabMeanings[activeTab].description}
                  </p>
                </div>

                <TabsContent value="transcript" className="mt-4 space-y-4">
                  <FieldGroup>
                    <Controller
                      name="mcqCount"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="new-note-mcq-count-transcript">
                            Video MCQ count / वीडियो MCQ संख्या
                          </FieldLabel>
                          <Input
                            {...field}
                            id="new-note-mcq-count-transcript"
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            placeholder="e.g. 50, 70, 100"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldDescription>
                            Required. We generate exactly this many bilingual
                            video MCQs. Larger counts take longer.
                          </FieldDescription>
                          {fieldState.invalid ? (
                            <FieldError errors={[fieldState.error]} />
                          ) : null}
                        </Field>
                      )}
                    />

                    <Field>
                      <FieldLabel htmlFor="new-note-file">
                        Upload transcript
                      </FieldLabel>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          ref={transcriptFileInputRef}
                          id="new-note-file"
                          type="file"
                          accept={acceptedTranscriptTypes}
                          className="sr-only"
                          onChange={handleTranscriptFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            transcriptFileInputRef.current?.click()
                          }
                        >
                          <UploadIcon />
                          Choose file
                        </Button>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                          <FileTextIcon className="size-4" />
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
                      name="mcqCount"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="new-note-mcq-count-youtube">
                            Video MCQ count / वीडियो MCQ संख्या
                          </FieldLabel>
                          <Input
                            {...field}
                            id="new-note-mcq-count-youtube"
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            placeholder="e.g. 50, 70, 100"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldDescription>
                            Required. We generate exactly this many bilingual
                            video MCQs. Larger counts take longer.
                          </FieldDescription>
                          {fieldState.invalid ? (
                            <FieldError errors={[fieldState.error]} />
                          ) : null}
                        </Field>
                      )}
                    />

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
                            Paste the full video link. Captions must be
                            available for note generation to work.
                          </FieldDescription>
                          {fieldState.invalid ? (
                            <FieldError errors={[fieldState.error]} />
                          ) : null}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="html" className="mt-4 space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="new-note-html-file">
                        Upload HTML notebook
                      </FieldLabel>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          ref={htmlFileInputRef}
                          id="new-note-html-file"
                          type="file"
                          accept={acceptedHtmlTypes}
                          className="sr-only"
                          onChange={handleHtmlFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => htmlFileInputRef.current?.click()}
                        >
                          <UploadIcon />
                          Choose HTML file
                        </Button>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                          <FileCode2Icon className="size-4" />
                          {htmlFileName || '.html or .htm'}
                        </p>
                      </div>
                      <FieldDescription>
                        Upload an HTML file or paste the notebook HTML below.
                      </FieldDescription>
                    </Field>

                    <Controller
                      name="notebookHtml"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="new-note-html-content">
                            HTML content
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id="new-note-html-content"
                            placeholder="Paste notebook HTML here, or upload a file above..."
                            rows={14}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid ? (
                            <FieldError errors={[fieldState.error]} />
                          ) : null}
                        </Field>
                      )}
                    />

                    <Controller
                      name="htmlTitle"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="new-note-html-title">
                            Note title
                          </FieldLabel>
                          <Input
                            {...field}
                            id="new-note-html-title"
                            placeholder="Optional title so you can recognize this topic later"
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
              </Tabs>
            </CardContent>
            <CardFooter className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                loading={createMutation.isPending}
              >
                {activeTab === 'html' ? 'Save notebook' : 'Generate notes'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

      <Dialog
        open={createSubjectOpen}
        onOpenChange={(open) => {
          setCreateSubjectOpen(open)

          if (!open) {
            createSubjectForm.reset()
          }
        }}
      >
        <DialogContent>
          <form noValidate onSubmit={submitCreateSubject}>
            <DialogHeader>
              <DialogTitle>New subject</DialogTitle>
              <DialogDescription>
                Create a folder to organize this note, like Physics or Exam
                prep.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Controller
                name="name"
                control={createSubjectForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="new-note-subject-name">
                      Subject name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="new-note-subject-name"
                      placeholder="e.g. Organic Chemistry"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateSubjectOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createSubjectMutation.isPending}>
                <PlusIcon />
                Add subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
