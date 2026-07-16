import { TRPCError } from '@trpc/server'

import { extractYoutubeVideoId, isYoutubeUrl } from '@/lib/youtube-url'

export type YoutubeTranscriptResult = {
  videoId: string
  transcript: string
}

export { extractYoutubeVideoId, isYoutubeUrl }

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player'
const INNERTUBE_CLIENT_VERSION = '20.10.38'
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14) gzip`
const WEB_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const PREFERRED_LANGS = ['en', 'en-US', 'en-GB'] as const

const BOT_CHECK_HINT =
  'YouTube blocked caption download from this server (bot check). Try again later, use a different network, or upload a transcript file instead.'

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

type WatchPageContext = {
  apiKey?: string
  playerResponse?: PlayerResponse
}

function badRequest(message: string): never {
  throw new TRPCError({ code: 'BAD_REQUEST', message })
}

function isBotBlockedReason(reason?: string) {
  if (!reason) {
    return false
  }

  const normalized = reason.toLowerCase()
  return (
    normalized.includes('not a bot') ||
    normalized.includes('sign in') ||
    normalized.includes('confirm you’re') ||
    normalized.includes("confirm you're")
  )
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
      (track) =>
        track.languageCode === lang && track.baseUrl && track.kind !== 'asr',
    )
    if (preferred) {
      return preferred
    }

    const auto = tracks.find(
      (track) => track.languageCode === lang && track.baseUrl,
    )
    if (auto) {
      return auto
    }
  }

  for (const lang of PREFERRED_LANGS) {
    const prefix = tracks.find(
      (track) =>
        track.languageCode?.startsWith(lang.split('-')[0]!) && track.baseUrl,
    )
    if (prefix) {
      return prefix
    }
  }

  return tracks.find((track) => track.baseUrl) ?? null
}

function captionTracksFromPlayer(data: PlayerResponse | undefined) {
  return (
    data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  ).filter((track) => Boolean(track.baseUrl))
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

function extractJsonObjectAfterMarker(html: string, marker: string) {
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) {
    return null
  }

  const start = html.indexOf('{', markerIndex + marker.length)
  if (start === -1) {
    return null
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < html.length; i += 1) {
    const char = html[i]!

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return html.slice(start, i + 1)
      }
    }
  }

  return null
}

async function fetchWatchPageContext(
  videoId: string,
): Promise<WatchPageContext> {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': WEB_USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  if (!response.ok) {
    return {}
  }

  const html = await response.text()

  if (
    html.includes('Sign in to confirm you’re not a bot') ||
    html.includes("Sign in to confirm you're not a bot")
  ) {
    badRequest(BOT_CHECK_HINT)
  }

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
  const playerJson = extractJsonObjectAfterMarker(
    html,
    'ytInitialPlayerResponse',
  )

  let playerResponse: PlayerResponse | undefined
  if (playerJson) {
    try {
      playerResponse = JSON.parse(playerJson) as PlayerResponse
    } catch {
      playerResponse = undefined
    }
  }

  return {
    apiKey: apiKeyMatch?.[1],
    playerResponse,
  }
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

  // ANDROID timedtext URLs often include fmt=srv3; replace so json3 wins.
  captionUrl.searchParams.delete('fmt')
  captionUrl.searchParams.set('fmt', 'json3')

  const response = await fetch(captionUrl.toString(), {
    headers: { 'User-Agent': WEB_USER_AGENT },
  })

  if (!response.ok) {
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
  if (!body.trim()) {
    badRequest(BOT_CHECK_HINT)
  }

  return parseJson3Transcript(body) || parseXmlTranscript(body)
}

async function fetchCaptionTracksFromInnertube(
  videoId: string,
  apiKey?: string,
): Promise<CaptionTrack[]> {
  const url = new URL(INNERTUBE_API_URL)
  url.searchParams.set('prettyPrint', 'false')
  if (apiKey) {
    url.searchParams.set('key', apiKey)
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': INNERTUBE_USER_AGENT,
      'X-YouTube-Client-Name': '3',
      'X-YouTube-Client-Version': INNERTUBE_CLIENT_VERSION,
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: INNERTUBE_CLIENT_VERSION,
          hl: 'en',
          gl: 'US',
        },
      },
      videoId,
    }),
  })

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as PlayerResponse
  const status = data.playabilityStatus?.status
  const reason = data.playabilityStatus?.reason

  if (status && status !== 'OK') {
    if (isBotBlockedReason(reason)) {
      badRequest(BOT_CHECK_HINT)
    }

    // Fall through to watch-page captions when the player rejects playback
    // but caption tracks may still be embedded in the watch HTML.
    return []
  }

  return captionTracksFromPlayer(data)
}

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const watch = await fetchWatchPageContext(videoId)

  const fromInnertube = await fetchCaptionTracksFromInnertube(
    videoId,
    watch.apiKey,
  )
  if (fromInnertube.length > 0) {
    return fromInnertube
  }

  const fromWatchPage = captionTracksFromPlayer(watch.playerResponse)
  if (fromWatchPage.length > 0) {
    return fromWatchPage
  }

  const reason = watch.playerResponse?.playabilityStatus?.reason
  if (isBotBlockedReason(reason)) {
    badRequest(BOT_CHECK_HINT)
  }

  if (
    watch.playerResponse?.playabilityStatus?.status &&
    watch.playerResponse.playabilityStatus.status !== 'OK'
  ) {
    badRequest(
      reason?.trim() ||
        'This YouTube video is unavailable. Try another link or upload a transcript file.',
    )
  }

  return []
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
