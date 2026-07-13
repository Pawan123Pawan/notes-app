'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

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
import { Badge } from '@/components/ui/badge'
import { BaseButton, Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NoteStatus } from '@/db/schema/note.constants'
import { triggerRouteProgressStart } from '@/lib/route-progress'
import { showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/react'

export type NoteDetailViewProps = {
  noteId: string
}

const noteDetailTabs = ['structured', 'notebook', 'transcript'] as const
type NoteDetailTab = (typeof noteDetailTabs)[number]

const statusLabels: Record<NoteStatus, string> = {
  pending: 'Queued',
  processing: 'Generating notes',
  completed: 'Ready',
  failed: 'Failed',
}

const statusVariants: Record<
  NoteStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  processing: 'default',
  completed: 'outline',
  failed: 'destructive',
}

function isProcessingStatus(status: NoteStatus) {
  return status === 'pending' || status === 'processing'
}

function parseNoteDetailTab(value: string | null): NoteDetailTab {
  if (value === 'notebook' || value === 'transcript') {
    return value
  }

  return 'structured'
}

function tabHref(noteId: string, tab: NoteDetailTab) {
  return tab === 'structured'
    ? `/app/notes/${noteId}`
    : `/app/notes/${noteId}?tab=${tab}`
}

export function NoteDetailView({ noteId }: NoteDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const activeTab = parseNoteDetailTab(searchParams.get('tab'))

  const noteQuery = useQuery({
    ...trpc.notes.getById.queryOptions({ noteId }),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isProcessingStatus(status) ? 2000 : false
    },
  })

  const subjectsQuery = useQuery(trpc.subjects.list.queryOptions())

  const updateSubjectMutation = useMutation(
    trpc.notes.updateSubject.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.notes.getById.queryKey({ noteId }),
        })
        toast.success('Subject updated')
      },
      onError: (error) => {
        showErrorToast(
          'Could not move note',
          error,
          'Unable to update the subject.',
        )
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.notes.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.notes.list.queryKey(),
        })
        const href = '/app'
        triggerRouteProgressStart(href)
        router.push(href)
        toast.success('Note deleted')
      },
      onError: (error) => {
        showErrorToast(
          'Could not delete note',
          error,
          'Unable to delete this note.',
        )
      },
    }),
  )

  const note = noteQuery.data
  const subjects = subjectsQuery.data ?? []

  if (noteQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12">
        <Spinner />
        <span className="text-muted-foreground text-sm">Loading note...</span>
      </div>
    )
  }

  if (noteQuery.isError || !note) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <p className="text-sm">This note could not be loaded.</p>
          <BaseButton asChild variant="outline">
            <Link href="/app">Back to dashboard</Link>
          </BaseButton>
        </CardContent>
      </Card>
    )
  }

  const subjectName = subjects.find(
    (subject) => subject.id === note.subjectId,
  )?.name

  return (
    <div className="space-y-6">
      <PageHeader
        title={note.title}
        description={
          note.sourceType === 'youtube' && note.sourceUrl
            ? `From ${note.sourceUrl}`
            : 'Generated from your transcript'
        }
        extraAction={
          <div className="flex flex-wrap items-center gap-2">
            {subjectName ? (
              <Badge variant="outline">{subjectName}</Badge>
            ) : null}
            <Badge variant={statusVariants[note.status]}>
              {statusLabels[note.status]}
            </Badge>
          </div>
        }
      />

      {note.status === 'completed' ? (
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={note.subjectId ?? 'none'}
            onValueChange={(value) => {
              updateSubjectMutation.mutate({
                noteId,
                subjectId: value === 'none' ? null : value,
              })
            }}
            disabled={updateSubjectMutation.isPending}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Move to subject" />
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

          {note.notebookHtml ? (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(note.notebookHtml)
                  toast.success('Notebook HTML copied')
                } catch {
                  toast.error('Could not copy HTML')
                }
              }}
            >
              <Copy />
              Copy HTML
            </Button>
          ) : null}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the note, structured content, and
                  notebook. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ noteId })}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete note'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      {isProcessingStatus(note.status) ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Spinner />
            <div>
              <p className="font-medium">Creating your notebook</p>
              <p className="text-muted-foreground text-sm">
                Generating detailed Hindi notes and colorful A4 notebook pages.
                This can take a few minutes for better quality.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {note.status === 'failed' ? (
        <Card className="border-destructive/40">
          <CardContent className="space-y-3 py-6">
            <p className="text-destructive font-medium">Processing failed</p>
            <p className="text-muted-foreground text-sm">
              {note.errorMessage ??
                'Something went wrong while generating this note.'}
            </p>
            <BaseButton asChild variant="outline">
              <Link href="/app/new">Try again</Link>
            </BaseButton>
          </CardContent>
        </Card>
      ) : null}

      {note.status === 'completed' ? (
        <Tabs value={activeTab}>
          <TabsList>
            <TabsTrigger asChild value="structured">
              <Link href={tabHref(noteId, 'structured')}>Structured notes</Link>
            </TabsTrigger>
            <TabsTrigger asChild value="notebook">
              <Link href={tabHref(noteId, 'notebook')}>Notebook</Link>
            </TabsTrigger>
            <TabsTrigger asChild value="transcript">
              <Link href={tabHref(noteId, 'transcript')}>Transcript</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structured" className="mt-4">
            <Card>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none py-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.structuredNotes}
                </ReactMarkdown>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notebook" className="mt-4">
            <Card>
              <CardContent className="bg-muted/40 overflow-auto p-4 sm:p-6">
                <iframe
                  title={`${note.title} notebook`}
                  srcDoc={note.notebookHtml}
                  className="mx-auto block min-h-[85vh] w-full max-w-[220mm] rounded-md border-0 bg-transparent"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript" className="mt-4">
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground mb-4 text-sm">
                  Original transcript used to generate this note.
                </p>
                <pre className="bg-muted/40 max-h-[70vh] overflow-auto rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {note.rawTranscript}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}
