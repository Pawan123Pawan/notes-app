import { requireSession } from './loader'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: React.PropsWithChildren) {
  await requireSession()

  return children
}
