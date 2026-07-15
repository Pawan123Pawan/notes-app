const youtubeHostPattern =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be|m\.youtube\.com)\//

const pathVideoIdPattern = /^\/(?:shorts|embed|live|v|watch)\/([^/?#]+)/

export function isYoutubeUrl(url: string) {
  return youtubeHostPattern.test(url)
}

export function extractYoutubeVideoId(url: string) {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const fromQuery = parsed.searchParams.get('v')
      if (fromQuery) {
        return fromQuery
      }

      const pathMatch = parsed.pathname.match(pathVideoIdPattern)
      if (pathMatch?.[1]) {
        return pathMatch[1]
      }
    }
  } catch {
    return null
  }

  return null
}
