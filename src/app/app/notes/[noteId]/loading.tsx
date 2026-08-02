import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function NoteLoading() {
  return (
    <PageContainer className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0 max-md:h-[calc(100dvh-3.5rem)] max-md:max-h-[calc(100dvh-3.5rem)] sm:gap-0 sm:px-0 md:h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-1rem)]">
      <NoteDetailSkeleton />
    </PageContainer>
  )
}
