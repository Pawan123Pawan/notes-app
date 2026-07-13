import { SubjectDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { Skeleton } from '@/components/ui/skeleton'

export default function SubjectLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <SubjectDetailSkeleton />
    </PageContainer>
  )
}
