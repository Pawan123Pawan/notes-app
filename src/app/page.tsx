import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hello',
  description: 'Hello world.',
}

export default function HomePage() {
  return <p>hello</p>
}
