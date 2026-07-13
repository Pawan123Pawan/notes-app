import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { Skeleton } from '@/components/ui/skeleton'

export default function NoteLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-48" />
      <NoteDetailSkeleton />
    </PageContainer>
  )
}
