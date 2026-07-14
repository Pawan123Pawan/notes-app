export const noteSourceTypes = ['youtube', 'transcript', 'html'] as const
export type NoteSourceType = (typeof noteSourceTypes)[number]

export const noteSourceTypeLabels: Record<NoteSourceType, string> = {
  youtube: 'YouTube',
  transcript: 'Transcript',
  html: 'HTML',
}

export const noteStatuses = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const
export type NoteStatus = (typeof noteStatuses)[number]
