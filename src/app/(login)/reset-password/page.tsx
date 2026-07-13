import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new password for your Notes App account.',
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
