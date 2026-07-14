import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function NoteLoading() {
  return (
    <PageContainer>
      <NoteDetailSkeleton />
    </PageContainer>
  )
}
