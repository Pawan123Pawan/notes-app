'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useSyncExternalStore } from 'react'

import {
  isSameRoute,
  ROUTE_TRANSITION_PROGRESS_EVENT,
} from '@/lib/route-progress'

type RouteTransitionState = {
  active: boolean
  destinationHref: string | null
}

let state: RouteTransitionState = {
  active: false,
  destinationHref: null,
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function setState(next: RouteTransitionState) {
  state = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function startTransition(destinationHref: string) {
  setState({ active: true, destinationHref })
}

function completeTransition() {
  setState({ active: false, destinationHref: null })
}

export function useRouteTransitionProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const currentSearch = search ? `?${search}` : ''

  const transition = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const handleAnchorClick = useCallback(
    (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) {
        return
      }

      if (isSameRoute(pathname, currentSearch, href)) {
        return
      }

      startTransition(href)
    },
    [currentSearch, pathname],
  )

  useEffect(() => {
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ href?: string }>
      const href = customEvent.detail?.href

      if (!href || isSameRoute(pathname, currentSearch, href)) {
        return
      }

      startTransition(href)
    }

    document.addEventListener('click', handleAnchorClick, true)
    window.addEventListener(
      ROUTE_TRANSITION_PROGRESS_EVENT,
      handleCustomEvent as EventListener,
    )

    return () => {
      document.removeEventListener('click', handleAnchorClick, true)
      window.removeEventListener(
        ROUTE_TRANSITION_PROGRESS_EVENT,
        handleCustomEvent as EventListener,
      )
    }
  }, [currentSearch, handleAnchorClick, pathname])

  useEffect(() => {
    if (transition.active) {
      completeTransition()
    }
  }, [pathname, currentSearch, transition.active])

  return transition
}
