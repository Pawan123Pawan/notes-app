import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'App',
  description: 'Your notes app home.',
}

export default function AppHomePage() {
  return (
    <main className="flex min-h-svh flex-col p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notes App</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Start building your product here.
      </p>
    </main>
  )
}
