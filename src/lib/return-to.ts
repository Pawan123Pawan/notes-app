const DEFAULT_AUTHENTICATED_PATH = '/app'

export function getSafeReturnTo(
  returnTo: string | null | undefined,
  fallback = DEFAULT_AUTHENTICATED_PATH,
) {
  if (!returnTo) {
    return fallback
  }

  const trimmedReturnTo = returnTo.trim()
  if (!trimmedReturnTo) {
    return fallback
  }

  if (trimmedReturnTo.startsWith('/')) {
    if (trimmedReturnTo.startsWith('//')) {
      return fallback
    }

    return trimmedReturnTo
  }

  try {
    const parsed = new URL(trimmedReturnTo)
    const normalizedPath = `${parsed.pathname}${parsed.search}`
    if (!normalizedPath.startsWith('/') || normalizedPath.startsWith('//')) {
      return fallback
    }

    return normalizedPath
  } catch {
    return fallback
  }
}
