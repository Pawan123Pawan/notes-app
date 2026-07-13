import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <Spinner className="text-muted-foreground size-5" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  )
}
