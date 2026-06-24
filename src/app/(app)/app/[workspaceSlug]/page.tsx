import type { Metadata } from 'next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

type WorkspaceHomePageProps = {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const metadata: Metadata = {
  title: 'Workspace dashboard',
  description:
    'View your workspace dashboard and continue building your product experience.',
}

export default async function WorkspaceHomePage({
  params,
}: WorkspaceHomePageProps) {
  const { workspaceSlug } = await params

  return (
    <PageContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Workspace Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Workspace Dashboard"
        description={
          <>
            You are viewing workspace <code>{workspaceSlug}</code>. Build your
            main product UI for this workspace here.
          </>
        }
      />
    </PageContainer>
  )
}
