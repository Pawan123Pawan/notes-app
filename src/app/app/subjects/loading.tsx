import { SubjectsGridSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { Skeleton } from '@/components/ui/skeleton'

export default function SubjectsLoading() {
  return (
    <PageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>
      <SubjectsGridSkeleton />
    </PageContainer>
  )
}
