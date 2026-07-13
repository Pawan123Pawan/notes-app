import { z } from 'zod'

import { noteSourceTypes } from '@/db/schema/note'

export const createNoteInput = z.discriminatedUnion('sourceType', [
  z.object({
    sourceType: z.literal('transcript'),
    transcript: z
      .string()
      .trim()
      .min(1, 'Transcript is required')
      .max(500_000, 'Transcript is too long'),
    subjectId: z.string().optional(),
  }),
  z.object({
    sourceType: z.literal('youtube'),
    url: z.url('Enter a valid YouTube URL'),
    subjectId: z.string().optional(),
  }),
])

export type CreateNoteInput = z.infer<typeof createNoteInput>

export const getNoteByIdInput = z.object({
  noteId: z.string().min(1),
})

export type GetNoteByIdInput = z.infer<typeof getNoteByIdInput>

export const listNotesInput = z.object({
  subjectId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
})

export type ListNotesInput = z.infer<typeof listNotesInput>

export const deleteNoteInput = z.object({
  noteId: z.string().min(1),
})

export type DeleteNoteInput = z.infer<typeof deleteNoteInput>

export const noteSourceTypeSchema = z.enum(noteSourceTypes)
