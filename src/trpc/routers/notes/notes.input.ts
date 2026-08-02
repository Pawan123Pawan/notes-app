import { z } from 'zod'

import { noteSourceTypes } from '@/db/schema/note.constants'
import { getNotebookHtmlMaxLength } from '@/lib/notebook-html-file'
import { isYoutubeUrl } from '@/lib/youtube-url'

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
    url: z
      .url('Enter a valid YouTube URL')
      .refine(isYoutubeUrl, 'Enter a valid YouTube URL'),
    subjectId: z.string().optional(),
  }),
  z.object({
    sourceType: z.literal('html'),
    notebookHtml: z
      .string()
      .trim()
      .min(1, 'HTML notebook is required')
      .max(getNotebookHtmlMaxLength(), 'HTML notebook is too long'),
    title: z.string().trim().min(1).max(200).optional(),
    subjectId: z.string().optional(),
  }),
])

export type CreateNoteInput = z.infer<typeof createNoteInput>

export const getNoteByIdInput = z.object({
  noteId: z.string().min(1),
})

export type GetNoteByIdInput = z.infer<typeof getNoteByIdInput>

export const listNotesInput = z.object({
  /** Omit for all notes; `null` for unassigned; string for a subject. */
  subjectId: z.string().nullable().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
})

export type ListNotesInput = z.infer<typeof listNotesInput>

export const reorderNotesInput = z.object({
  subjectId: z.string().nullable(),
  noteIds: z.array(z.string().min(1)).min(1).max(50),
})

export type ReorderNotesInput = z.infer<typeof reorderNotesInput>

export const deleteNoteInput = z.object({
  noteId: z.string().min(1),
})

export type DeleteNoteInput = z.infer<typeof deleteNoteInput>

export const updateNoteSubjectInput = z.object({
  noteId: z.string().min(1),
  subjectId: z.string().nullable().optional(),
})

export type UpdateNoteSubjectInput = z.infer<typeof updateNoteSubjectInput>

export const updateNoteTitleInput = z.object({
  noteId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title is too long'),
})

export type UpdateNoteTitleInput = z.infer<typeof updateNoteTitleInput>

export const noteSourceTypeSchema = z.enum(noteSourceTypes)
