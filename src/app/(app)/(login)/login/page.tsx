import type { Metadata } from 'next'

import { redirectIfAuthenticated } from '@/lib/auth-server'
import { getSafeReturnTo } from '@/lib/return-to'
import { env } from '@/lib/env'

import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your account',
}

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = await searchParams
  const safeReturnTo = getSafeReturnTo(returnTo)
  await redirectIfAuthenticated(safeReturnTo)
  const googleOAuthEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  )
  const githubOAuthEnabled = Boolean(
    env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET,
  )

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <LoginForm
          githubOAuthEnabled={githubOAuthEnabled}
          googleOAuthEnabled={googleOAuthEnabled}
          returnTo={safeReturnTo}
        />
      </div>
    </div>
  )
}
