import type { Metadata } from 'next'

import { redirectIfAuthenticated } from '@/lib/auth-server'
import { getSafeReturnTo } from '@/lib/return-to'

import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create an account',
}

type SignupPageProps = {
  searchParams: Promise<{
    returnTo?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { returnTo } = await searchParams
  const safeReturnTo = getSafeReturnTo(returnTo)
  await redirectIfAuthenticated(safeReturnTo)

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <SignupForm returnTo={safeReturnTo} />
      </div>
    </div>
  )
}
