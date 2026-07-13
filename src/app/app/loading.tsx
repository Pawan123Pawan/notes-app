import { AppPageSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function AppLoading() {
  return (
    <PageContainer>
      <AppPageSkeleton />
    </PageContainer>
  )
}
