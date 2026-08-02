import { SubjectsPageSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function SubjectsLoading() {
  return (
    <PageContainer>
      <SubjectsPageSkeleton />
    </PageContainer>
  )
}
