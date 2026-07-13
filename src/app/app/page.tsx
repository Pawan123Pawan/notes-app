import type { Metadata } from 'next'
import Link from 'next/link'

import { SignOutButton } from '@/app/app/sign-out-button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

import { requireSession } from './loader'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your notes workspace.',
}

export default async function AppDashboardPage() {
  const session = await requireSession()

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name}.`}
        extraAction={<SignOutButton />}
      />
      <p className="text-muted-foreground text-sm">
        Your notes collection will appear here.{' '}
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </PageContainer>
  )
}
