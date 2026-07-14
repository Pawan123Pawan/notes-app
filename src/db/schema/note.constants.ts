export const noteSourceTypes = ['youtube', 'transcript', 'html'] as const
export type NoteSourceType = (typeof noteSourceTypes)[number]

export const noteSourceTypeLabels: Record<NoteSourceType, string> = {
  youtube: 'From YouTube video',
  transcript: 'From transcript',
  html: 'From HTML notebook',
}

export const noteStatuses = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const
export type NoteStatus = (typeof noteStatuses)[number]
