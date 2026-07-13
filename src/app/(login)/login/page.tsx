import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AuthFormSkeleton } from '@/components/app-skeletons'

import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Notes App account.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
