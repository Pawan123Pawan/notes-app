import { SubjectDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { Skeleton } from '@/components/ui/skeleton'

export default function SubjectLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-40" />
      <SubjectDetailSkeleton />
    </PageContainer>
  )
}
