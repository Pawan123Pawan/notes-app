import { TRPCError } from '@trpc/server'
import mongoose from 'mongoose'

import { connectDB } from '@/db'
import {
  Note,
  type NoteDocument,
  type NoteMetadata,
  type NoteSourceType,
  type NoteStatus,
} from '@/db/schema/note'

import type {
  CreateNoteInput,
  GetNoteByIdInput,
  ListNotesInput,
} from '@/trpc/routers/notes/notes.input'

export type NoteSummary = {
  id: string
  title: string
  sourceType: NoteSourceType
  sourceUrl?: string
  status: NoteStatus
  subjectId?: string
  metadata: NoteMetadata
  createdAt: Date
  updatedAt: Date
}

export type NoteDetail = NoteSummary & {
  rawTranscript: string
  structuredNotes: string
  notebookHtml: string
  errorMessage?: string
}

export type CreateNoteResult = {
  id: string
  status: NoteStatus
}

export type ListNotesResult = {
  items: NoteSummary[]
  nextCursor?: string
}

function toNoteSummary(note: NoteDocument): NoteSummary {
  return {
    id: note._id.toString(),
    title: note.title,
    sourceType: note.sourceType,
    sourceUrl: note.sourceUrl ?? undefined,
    status: note.status,
    subjectId: note.subjectId?.toString(),
    metadata: note.metadata ?? {},
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

function toNoteDetail(note: NoteDocument): NoteDetail {
  return {
    ...toNoteSummary(note),
    rawTranscript: note.rawTranscript,
    structuredNotes: note.structuredNotes,
    notebookHtml: note.notebookHtml,
    errorMessage: note.errorMessage ?? undefined,
  }
}

function parseSubjectId(subjectId?: string) {
  if (!subjectId) {
    return undefined
  }

  if (!mongoose.isValidObjectId(subjectId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid subject id',
    })
  }

  return new mongoose.Types.ObjectId(subjectId)
}

async function enqueueNoteProcessing(_noteId: string) {
  // BullMQ worker wiring lands in a later feature.
}

export async function createNote(
  userId: string,
  input: CreateNoteInput,
): Promise<CreateNoteResult> {
  if (input.sourceType === 'youtube') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'YouTube URLs are not supported yet. Paste a transcript instead.',
    })
  }

  await connectDB()

  const note = await Note.create({
    userId,
    subjectId: parseSubjectId(input.subjectId),
    sourceType: input.sourceType,
    rawTranscript: input.transcript,
    status: 'pending',
  })

  await enqueueNoteProcessing(note._id.toString())

  return {
    id: note._id.toString(),
    status: note.status,
  }
}

export async function getNoteById(
  userId: string,
  input: GetNoteByIdInput,
): Promise<NoteDetail> {
  if (!mongoose.isValidObjectId(input.noteId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid note id',
    })
  }

  await connectDB()

  const note = await Note.findOne({
    _id: input.noteId,
    userId,
  })

  if (!note) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Note not found',
    })
  }

  return toNoteDetail(note)
}

export async function listNotes(
  userId: string,
  input: ListNotesInput,
): Promise<ListNotesResult> {
  await connectDB()

  const filter: Record<string, unknown> = { userId }

  const subjectId = parseSubjectId(input.subjectId)
  if (subjectId) {
    filter.subjectId = subjectId
  }

  if (input.cursor) {
    if (!mongoose.isValidObjectId(input.cursor)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid cursor',
      })
    }

    const cursorNote = await Note.findOne({
      _id: input.cursor,
      userId,
    })

    if (cursorNote) {
      filter.$or = [
        { createdAt: { $lt: cursorNote.createdAt } },
        {
          createdAt: cursorNote.createdAt,
          _id: { $lt: cursorNote._id },
        },
      ]
    }
  }

  const notes = await Note.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(input.limit + 1)
    .select(
      'title sourceType sourceUrl status subjectId metadata createdAt updatedAt',
    )

  const hasMore = notes.length > input.limit
  const page = hasMore ? notes.slice(0, input.limit) : notes
  const nextCursor = hasMore ? page.at(-1)?._id.toString() : undefined

  return {
    items: page.map((note) => toNoteSummary(note)),
    nextCursor,
  }
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<void> {
  if (!mongoose.isValidObjectId(noteId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid note id',
    })
  }

  await connectDB()

  const result = await Note.deleteOne({ _id: noteId, userId })

  if (result.deletedCount === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Note not found',
    })
  }
}
