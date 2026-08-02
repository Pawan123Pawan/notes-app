import { SubjectDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function SubjectLoading() {
  return (
    <PageContainer>
      <SubjectDetailSkeleton />
    </PageContainer>
  )
}
