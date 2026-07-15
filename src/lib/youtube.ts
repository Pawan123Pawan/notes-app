import { TRPCError } from '@trpc/server'

import { extractYoutubeVideoId, isYoutubeUrl } from '@/lib/youtube-url'

export type YoutubeTranscriptResult = {
  videoId: string
  transcript: string
}

export { extractYoutubeVideoId, isYoutubeUrl }

const INNERTUBE_API_URL =
  'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const INNERTUBE_CLIENT_VERSION = '20.10.38'
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`
const WEB_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const PREFERRED_LANGS = ['en', 'en-US', 'en-GB'] as const

type CaptionTrack = {
  baseUrl?: string
  languageCode?: string
  kind?: string
}

type PlayerResponse = {
  playabilityStatus?: { status?: string; reason?: string }
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[]
    }
  }
}

type Json3Event = {
  tStartMs?: number
  dDurationMs?: number
  segs?: Array<{ utf8?: string }>
}

function badRequest(message: string): never {
  throw new TRPCError({ code: 'BAD_REQUEST', message })
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
}

function isYoutubeCaptionHost(hostname: string) {
  return (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname.endsWith('.youtube.com')
  )
}

function pickCaptionTrack(tracks: CaptionTrack[]) {
  for (const lang of PREFERRED_LANGS) {
    const preferred = tracks.find(
      (track) => track.languageCode === lang && track.baseUrl,
    )
    if (preferred) {
      return preferred
    }
  }

  return tracks.find((track) => track.baseUrl) ?? null
}

function parseJson3Transcript(body: string) {
  let parsed: { events?: Json3Event[] }
  try {
    parsed = JSON.parse(body) as { events?: Json3Event[] }
  } catch {
    return ''
  }

  return (parsed.events ?? [])
    .map((event) =>
      (event.segs ?? [])
        .map((seg) => seg.utf8?.trim() ?? '')
        .filter(Boolean)
        .join(''),
    )
    .map((text) => decodeEntities(text).trim())
    .filter(Boolean)
    .join(' ')
    .trim()
}

function parseXmlTranscript(body: string) {
  const segments: string[] = []

  const srv3 = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g
  for (const match of body.matchAll(srv3)) {
    const inner = match[3]
    const fromWords = [...inner.matchAll(/<s[^>]*>([^<]*)<\/s>/g)]
      .map((word) => word[1])
      .join('')
    const text = decodeEntities(
      (fromWords || inner.replace(/<[^>]+>/g, '')).trim(),
    )
    if (text) {
      segments.push(text)
    }
  }

  if (segments.length > 0) {
    return segments.join(' ').trim()
  }

  const classic = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g
  for (const match of body.matchAll(classic)) {
    const text = decodeEntities(match[3].trim())
    if (text) {
      segments.push(text)
    }
  }

  return segments.join(' ').trim()
}

async function fetchCaptionTrackText(baseUrl: string) {
  let captionUrl: URL
  try {
    captionUrl = new URL(baseUrl)
  } catch {
    badRequest(
      'Unable to fetch captions for this video. Try uploading a transcript file instead.',
    )
  }

  if (!isYoutubeCaptionHost(captionUrl.hostname)) {
    badRequest(
      'Unable to fetch captions for this video. Try uploading a transcript file instead.',
    )
  }

  // json3 is more reliable than the default XML format across clients.
  captionUrl.searchParams.set('fmt', 'json3')

  const response = await fetch(captionUrl.toString(), {
    headers: { 'User-Agent': WEB_USER_AGENT },
  })

  if (!response.ok) {
    // Fall back to the track's default format.
    const fallback = await fetch(baseUrl, {
      headers: { 'User-Agent': WEB_USER_AGENT },
    })
    if (!fallback.ok) {
      badRequest(
        'Unable to fetch captions for this video. Try uploading a transcript file instead.',
      )
    }
    const xmlBody = await fallback.text()
    return parseXmlTranscript(xmlBody) || parseJson3Transcript(xmlBody)
  }

  const body = await response.text()
  return parseJson3Transcript(body) || parseXmlTranscript(body)
}

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const response = await fetch(INNERTUBE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': INNERTUBE_USER_AGENT,
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: INNERTUBE_CLIENT_VERSION,
        },
      },
      videoId,
    }),
  })

  if (!response.ok) {
    badRequest(
      'Unable to fetch captions for this video. Try uploading a transcript file instead.',
    )
  }

  const data = (await response.json()) as PlayerResponse
  const status = data.playabilityStatus?.status

  if (status && status !== 'OK') {
    const reason = data.playabilityStatus?.reason
    badRequest(
      reason?.trim() ||
        'This YouTube video is unavailable. Try another link or upload a transcript file.',
    )
  }

  const tracks =
    data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

  return tracks.filter((track) => Boolean(track.baseUrl))
}

function mapFetchError(error: unknown): never {
  if (error instanceof TRPCError) {
    throw error
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error)

  if (
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('fetch failed') ||
    message.includes('network')
  ) {
    badRequest(
      'Could not reach YouTube to download captions. Check your network connection, or upload a transcript file instead.',
    )
  }

  console.error('[youtube] caption fetch failed', error)
  badRequest(
    'Unable to fetch captions for this video. Try uploading a transcript file instead.',
  )
}

export async function fetchYoutubeTranscript(
  url: string,
): Promise<YoutubeTranscriptResult> {
  if (!isYoutubeUrl(url)) {
    badRequest('Enter a valid YouTube URL')
  }

  const videoId = extractYoutubeVideoId(url)

  if (!videoId) {
    badRequest('Could not read a YouTube video id from that URL')
  }

  try {
    const tracks = await fetchCaptionTracks(videoId)

    if (tracks.length === 0) {
      badRequest(
        'No captions were found for this video. Upload a transcript file instead.',
      )
    }

    const track = pickCaptionTrack(tracks)
    if (!track?.baseUrl) {
      badRequest(
        'No captions were found for this video. Upload a transcript file instead.',
      )
    }

    const transcript = await fetchCaptionTrackText(track.baseUrl)

    if (!transcript) {
      badRequest(
        'No captions were found for this video. Upload a transcript file instead.',
      )
    }

    return { videoId, transcript }
  } catch (error) {
    mapFetchError(error)
  }
}
