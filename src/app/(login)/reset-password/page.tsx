import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AuthFormSkeleton } from '@/components/app-skeletons'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new password for your Notes App account.',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
