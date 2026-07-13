import type { Metadata } from 'next'

import { resolveRootRedirect } from './loader'

export const metadata: Metadata = {
  title: 'Notes App',
  description:
    'Turn YouTube videos and transcripts into structured study notes and handwritten notebooks.',
}

export default async function HomePage() {
  await resolveRootRedirect()
}
