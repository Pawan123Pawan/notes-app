import { NewNoteFormSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewNoteLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <NewNoteFormSkeleton />
    </PageContainer>
  )
}
