export const noteSourceTypes = ['youtube', 'transcript'] as const
export type NoteSourceType = (typeof noteSourceTypes)[number]

export const noteStatuses = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const
export type NoteStatus = (typeof noteStatuses)[number]
