import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  getCurrentSession,
  getLoginPath,
  getUserOnboarding,
  isUserOnboarded,
} from '@/lib/auth-server'

import { GetStartedForm } from './get-started-form'

export const metadata: Metadata = {
  title: 'Get started',
  description:
    'Answer a few onboarding questions so we can personalize your experience.',
}

export default async function GetStartedPage() {
  const session = await getCurrentSession()
  if (!session) {
    redirect(getLoginPath('/app/get-started'))
  }

  if (await isUserOnboarded(session.user.id)) {
    redirect('/app')
  }

  const onboarding = await getUserOnboarding(session.user.id)
  const initialTools = onboarding?.toolsUsed
    ? onboarding.toolsUsed
        .split(',')
        .map((tool) => tool.trim())
        .filter(Boolean)
    : []

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <GetStartedForm
          initialValues={{
            role: onboarding?.role ?? '',
            toolsUsed: initialTools,
            howFoundUs: onboarding?.howFoundUs ?? '',
          }}
        />
      </div>
    </div>
  )
}
