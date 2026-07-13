import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Notes App',
  description:
    'Turn YouTube videos and transcripts into structured study notes and handwritten notebooks.',
}

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-8 p-6 sm:p-10">
      <div className="space-y-3">
        <p className="text-primary text-sm font-medium">Notes collection</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Turn videos and transcripts into study-ready notes.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Paste a YouTube link or transcript, summarize the content, and export
          structured notes or handwritten notebook pages.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="border-border hover:bg-muted inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium"
        >
          Sign in
        </Link>
        <Link
          href="/app"
          className="text-primary inline-flex h-9 items-center justify-center px-2 text-sm font-medium hover:underline"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
