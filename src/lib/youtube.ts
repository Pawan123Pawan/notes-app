import { TRPCError } from '@trpc/server'
import { YoutubeTranscript } from 'youtube-transcript'

import { extractYoutubeVideoId, isYoutubeUrl } from '@/lib/youtube-url'

export type YoutubeTranscriptResult = {
  videoId: string
  transcript: string
}

export { extractYoutubeVideoId, isYoutubeUrl }

export async function fetchYoutubeTranscript(
  url: string,
): Promise<YoutubeTranscriptResult> {
  if (!isYoutubeUrl(url)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Enter a valid YouTube URL',
    })
  }

  const videoId = extractYoutubeVideoId(url)

  if (!videoId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Could not read a YouTube video id from that URL',
    })
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId)
    const transcript = segments
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(' ')
      .trim()

    if (!transcript) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'No captions were found for this video. Upload a transcript file instead.',
      })
    }

    return { videoId, transcript }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error
    }

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Unable to fetch captions for this video. Try uploading a transcript file instead.',
    })
  }
}
