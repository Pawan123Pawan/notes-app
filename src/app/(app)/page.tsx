import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Micro SaaS Starter',
  description:
    'Production-ready Next.js template with Better Auth, Drizzle and PostgreSQL, TanStack Query, and tRPC.',
}

export default function HomePage() {
  redirect('/app')
}
