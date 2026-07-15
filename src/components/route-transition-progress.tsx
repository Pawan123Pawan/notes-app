'use client'

import { Suspense } from 'react'

import { useRouteTransitionProgress } from '@/hooks/use-route-transition-progress'
import { cn } from '@/lib/utils'

function RouteTransitionProgressBar() {
  const transition = useRouteTransitionProgress()

  return (
    <div
      aria-hidden
      className={cn(
        'bg-primary pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left transition-[transform,opacity] duration-300 ease-out',
        transition.active ? 'scale-x-90 opacity-100' : 'scale-x-0 opacity-0',
      )}
    />
  )
}

export function RouteTransitionProgress() {
  return (
    <Suspense fallback={null}>
      <RouteTransitionProgressBar />
    </Suspense>
  )
}
