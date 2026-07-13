export function sanitizeReturnTo(
  returnTo: string | null | undefined,
  fallback = '/app',
) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return fallback
  }

  return returnTo
}
