'use client'

import { NotebookPenIcon, PaletteIcon, SparklesIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const stages = [
  {
    label: 'Reading transcript',
    tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  {
    label: 'Writing revision cards',
    tone: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  {
    label: 'Building synthesis table',
    tone: 'bg-teal-500/15 text-teal-800 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  {
    label: 'Generating MCQ quiz',
    tone: 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  {
    label: 'Rendering HTML document',
    tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
] as const

const inkSwatches = [
  'bg-rose-500',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-fuchsia-500',
] as const

export function GeneratingNotebookState() {
  return (
    <Card className="border-primary/20 from-primary/8 dark:from-primary/15 relative flex-1 overflow-hidden bg-gradient-to-br via-amber-500/5 to-violet-500/10 dark:via-amber-500/5 dark:to-violet-500/15">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 12% 18%, oklch(0.75 0.14 155 / 0.35), transparent 28%),
            radial-gradient(circle at 88% 22%, oklch(0.78 0.14 290 / 0.28), transparent 30%),
            radial-gradient(circle at 70% 85%, oklch(0.8 0.14 85 / 0.25), transparent 32%),
            radial-gradient(circle at 20% 80%, oklch(0.78 0.12 230 / 0.22), transparent 28%)
          `,
        }}
      />
      <CardContent className="relative flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative mx-auto flex size-28 shrink-0 items-center justify-center sm:mx-0">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-sky-400/30 via-emerald-400/25 to-violet-400/30 blur-md" />
          <div className="border-primary/25 bg-card/90 relative flex size-24 rotate-[-4deg] flex-col justify-between rounded-xl border p-3 shadow-lg shadow-emerald-500/10">
            <div className="space-y-1.5">
              <div className="h-1.5 w-14 rounded-full bg-blue-500/70" />
              <div className="h-1.5 w-10 rounded-full bg-violet-500/70" />
              <div className="h-1.5 w-16 rounded-full bg-amber-500/70" />
              <div className="h-1.5 w-12 rounded-full bg-rose-500/70" />
              <div className="h-1.5 w-16 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex items-center gap-1.5">
              <NotebookPenIcon className="text-primary size-4" />
              <PaletteIcon className="size-3.5 text-violet-500" />
              <SparklesIcon className="size-3.5 text-amber-500" />
            </div>
          </div>
          <Spinner className="bg-background text-primary absolute -right-1 -bottom-1 size-8 rounded-full p-1.5 shadow-md" />
        </div>

        <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
          <div className="space-y-1.5">
            <p className="text-lg font-semibold tracking-tight">
              Creating your revision notes
            </p>
            <p className="text-muted-foreground text-sm text-pretty">
              Generating bilingual revision cards, a summary table, and MCQs.
              This can take several minutes for richer content and better
              quality.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {inkSwatches.map((swatch, index) => (
              <span
                key={swatch}
                className={cn(
                  'size-2.5 animate-pulse rounded-full shadow-sm',
                  swatch,
                )}
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {stages.map((stage) => (
              <li
                key={stage.label}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium',
                  stage.tone,
                )}
              >
                <span
                  className={cn('size-1.5 shrink-0 rounded-full', stage.dot)}
                />
                {stage.label}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
