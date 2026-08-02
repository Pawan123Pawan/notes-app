import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function NoteCardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-3/5" />
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
    </Card>
  )
}

export function NotesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading notes"
    >
      {Array.from({ length: count }, (_, index) => (
        <NoteCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function SubjectCardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="size-7 shrink-0 rounded-md" />
        </div>
        <Skeleton className="h-4 w-16" />
      </CardHeader>
    </Card>
  )
}

export function SubjectsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading subjects"
    >
      {Array.from({ length: count }, (_, index) => (
        <SubjectCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function SubjectsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Loading subjects"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-40 max-w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function SubjectsViewSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading">
      <SubjectsListSkeleton />
    </div>
  )
}

export function NoteDetailSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      aria-busy="true"
      aria-label="Loading note"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <Skeleton className="min-h-0 w-full flex-1 rounded-none" />
    </div>
  )
}

export function SubjectDetailSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-label="Loading subject"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(17rem,20rem)_1fr]">
        <Card>
          <CardHeader className="gap-2 border-b">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full max-w-56" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-[92%]" />
            <Skeleton className="h-9 w-[84%]" />
            <Skeleton className="h-9 w-[70%]" />
          </CardContent>
        </Card>

        <Card size="sm" className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-9 w-28 shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <NotesGridSkeleton count={3} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-16 shrink-0" />
          </div>
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
    </div>
  )
}

export function NewNoteFormSkeleton() {
  return (
    <Card aria-busy="true" aria-label="Loading form">
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full max-w-xs" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-36" />
      </CardFooter>
    </Card>
  )
}

export function AuthFormSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 rounded-xl border p-6"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

export function AppPageSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>
      <SubjectsGridSkeleton />
    </div>
  )
}
