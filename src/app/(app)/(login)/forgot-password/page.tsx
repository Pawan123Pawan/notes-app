import type { Metadata } from 'next'

import { redirectIfAuthenticated } from '@/lib/auth-server'

import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your password',
}

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated()

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
