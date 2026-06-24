import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSafeReturnTo } from '@/lib/return-to'

export function getLoginPath(returnTo: string) {
  const params = new URLSearchParams({
    returnTo: getSafeReturnTo(returnTo),
  })
  return `/login?${params.toString()}`
}

function getReturnToFromHeaders(requestHeaders: Headers): string | null {
  const candidate =
    requestHeaders.get('x-url') ?? requestHeaders.get('x-pathname')

  if (!candidate) {
    return null
  }

  if (candidate.startsWith('/')) {
    return candidate
  }

  try {
    const parsed = new URL(candidate)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return null
  }
}

/** Redirects to `/` when a session exists (guest-only routes). */
export async function redirectIfAuthenticated(returnTo?: string | null) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) {
    redirect(getSafeReturnTo(returnTo))
  }
}

/** Redirects to `/login` when no session exists (protected routes). */
export async function redirectIfNotAuthenticated(returnTo: string) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) {
    const requestReturnTo = getReturnToFromHeaders(requestHeaders)
    redirect(getLoginPath(getSafeReturnTo(requestReturnTo ?? returnTo)))
  }
}

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() })
}
