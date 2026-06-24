import type { Metadata } from 'next'
import { Suspense } from 'react'

import { redirectIfAuthenticated } from '@/lib/auth-server'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password',
}

function ResetPasswordFallback() {
  return (
    <div className="text-muted-foreground flex min-h-48 items-center justify-center text-sm">
      Loading…
    </div>
  )
}

export default async function ResetPasswordPage() {
  await redirectIfAuthenticated()

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Suspense fallback={<ResetPasswordFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
