import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type {
  AppearanceAccentColor,
  AppearanceBaseColor,
  AppearanceTheme,
} from '@/lib/appearance'
import { getSafeReturnTo } from '@/lib/return-to'
import {
  getUserOnboarding as getUserOnboardingService,
  isUserOnboarded as isUserOnboardedService,
} from '@/trpc/routers/onboarding.service'
import { getUserWorkspaceAppearance as getUserWorkspaceAppearanceService } from '@/trpc/routers/settings.service'
import {
  getPrimaryWorkspace as getPrimaryWorkspaceService,
  getUserWorkspaces as getUserWorkspacesService,
} from '@/trpc/routers/workspaces.service'

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

export async function getUserWorkspaces(userId: string) {
  return getUserWorkspacesService(userId)
}

export async function getPrimaryWorkspace(userId: string) {
  return getPrimaryWorkspaceService(userId)
}

export async function getUserOnboarding(userId: string) {
  return getUserOnboardingService(userId)
}

export async function isUserOnboarded(userId: string) {
  return isUserOnboardedService(userId)
}

export async function getUserWorkspaceAppearance(
  userId: string,
  workspaceId: string,
): Promise<{
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}> {
  return getUserWorkspaceAppearanceService(userId, workspaceId)
}
