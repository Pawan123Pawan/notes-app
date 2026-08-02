import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { NewNoteFormSkeleton } from '@/components/app-skeletons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

import { NewNoteForm } from './new-note-form'

export const metadata: Metadata = {
  title: 'New note',
  description:
    'Upload a transcript, add a YouTube URL, or import an HTML notebook file to save study notes.',
}

export default function NewNotePage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New note</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title="New note"
          description="Upload a transcript, paste a YouTube URL, or import an HTML notebook file."
        />
      </div>

      <Suspense fallback={<NewNoteFormSkeleton />}>
        <NewNoteForm />
      </Suspense>
    </PageContainer>
  )
}
