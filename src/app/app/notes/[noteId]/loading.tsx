import { NoteDetailSkeleton } from '@/components/app-skeletons'
import { PageContainer } from '@/components/ui/page-container'

export default function NoteLoading() {
  return (
    <PageContainer className="flex h-dvh max-h-dvh flex-1 flex-col gap-0 overflow-hidden p-0 sm:gap-0 sm:px-0 md:h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-1rem)]">
      <NoteDetailSkeleton />
    </PageContainer>
  )
}
