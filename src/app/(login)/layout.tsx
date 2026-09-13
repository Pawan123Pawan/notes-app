import type { Metadata } from 'next'
import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'

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
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.9_0_0/_0.55),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.88_0_0/_0.35),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.3_0_0/_0.45),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.28_0_0/_0.3),_transparent_50%)]"
      />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <Link
          href="/login"
          className="text-primary text-2xl font-semibold tracking-tight"
        >
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
