const youtubeHostPattern =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\//

export function isYoutubeUrl(url: string) {
  return youtubeHostPattern.test(url)
}

export function extractYoutubeVideoId(url: string) {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }

    if (parsed.hostname.includes('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v')
      if (fromQuery) {
        return fromQuery
      }

      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/)
      if (shortsMatch?.[1]) {
        return shortsMatch[1]
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      if (embedMatch?.[1]) {
        return embedMatch[1]
      }
    }
  } catch {
    return null
  }

  return null
}
