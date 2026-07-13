import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Notes App',
  description:
    'A notes app built with Next.js, Better Auth, MongoDB, and tRPC.',
}

export default function HomePage() {
  redirect('/app')
}
