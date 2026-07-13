import type { Metadata } from 'next'
import Link from 'next/link'

import { redirectIfAuthenticated } from './loader'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Notes App account.',
}

export default async function LoginLayout({
  children,
}: React.PropsWithChildren) {
  await redirectIfAuthenticated()

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="mb-8 text-center">
        <Link href="/login" className="text-lg font-semibold tracking-tight">
          Notes App
        </Link>
        <p className="text-muted-foreground mt-1 text-sm">
          Turn videos and transcripts into study notes.
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
