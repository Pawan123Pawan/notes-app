export const ROUTE_TRANSITION_PROGRESS_EVENT = 'route-transition-progress-start'

export function triggerRouteProgressStart(destinationHref: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(ROUTE_TRANSITION_PROGRESS_EVENT, {
      detail: { href: destinationHref },
    }),
  )
}

function normalizeHref(href: string) {
  const url = new URL(href, window.location.origin)
  return `${url.pathname}${url.search}`
}

export function isSameRoute(
  currentPathname: string,
  currentSearch: string,
  destinationHref: string,
) {
  const current = `${currentPathname}${currentSearch}`
  const destination = normalizeHref(destinationHref)
  return current === destination
}
