import { NewNotePageSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function NewNoteLoading() {
  return (
    <PageContainer>
      <NewNotePageSkeleton />
    </PageContainer>
  )
}
