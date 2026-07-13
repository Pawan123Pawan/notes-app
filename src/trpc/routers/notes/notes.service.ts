import { TRPCError } from '@trpc/server'
import mongoose from 'mongoose'

import { connectDB } from '@/db'
import { Note, type NoteDocument, type NoteMetadata } from '@/db/schema/note'
import type { NoteSourceType, NoteStatus } from '@/db/schema/note.constants'
import {
  generateNoteTitle,
  renderNotebookHtml,
  structureTranscript,
} from '@/lib/llm'
import { getErrorMessage } from '@/lib/utils'
import { fetchYoutubeTranscript } from '@/lib/youtube'

import { Subject } from '@/db/schema/subject'

import type {
  CreateNoteInput,
  GetNoteByIdInput,
  ListNotesInput,
  UpdateNoteSubjectInput,
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

function scheduleNoteProcessing(noteId: string) {
  void processNote(noteId).catch((error) => {
    console.error(
      `[notes] Background processing failed for ${noteId}:`,
      getErrorMessage(error, 'Note processing failed'),
    )
  })
}

export async function processNote(noteId: string) {
  if (!mongoose.isValidObjectId(noteId)) {
    throw new Error(`Invalid note id: ${noteId}`)
  }

  await connectDB()

  const note = await Note.findById(noteId)

  if (!note) {
    throw new Error(`Note ${noteId} not found`)
  }

  if (note.status === 'completed') {
    return
  }

  await Note.updateOne(
    { _id: noteId },
    {
      status: 'processing',
      errorMessage: null,
    },
  )

  try {
    const structuredNotes = await structureTranscript(note.rawTranscript)
    const [notebookHtml, title] = await Promise.all([
      renderNotebookHtml(structuredNotes),
      generateNoteTitle(structuredNotes),
    ])

    await Note.updateOne(
      { _id: noteId },
      {
        structuredNotes,
        notebookHtml,
        title: title.trim() || note.title,
        status: 'completed',
        errorMessage: null,
      },
    )
  } catch (error) {
    const message = getErrorMessage(error, 'Note processing failed')

    await Note.updateOne(
      { _id: noteId },
      {
        status: 'failed',
        errorMessage: message,
      },
    )

    throw error
  }
}

export async function createNote(
  userId: string,
  input: CreateNoteInput,
): Promise<CreateNoteResult> {
  await connectDB()

  if (input.sourceType === 'youtube') {
    const { videoId, transcript } = await fetchYoutubeTranscript(input.url)

    const note = await Note.create({
      userId,
      subjectId: parseSubjectId(input.subjectId),
      sourceType: 'youtube',
      sourceUrl: input.url,
      rawTranscript: transcript,
      metadata: {
        videoTitle: videoId,
      },
      status: 'pending',
    })

    scheduleNoteProcessing(note._id.toString())

    return {
      id: note._id.toString(),
      status: note.status,
    }
  }

  const note = await Note.create({
    userId,
    subjectId: parseSubjectId(input.subjectId),
    sourceType: input.sourceType,
    rawTranscript: input.transcript,
    status: 'pending',
  })

  scheduleNoteProcessing(note._id.toString())

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

export async function updateNoteSubject(
  userId: string,
  input: UpdateNoteSubjectInput,
): Promise<NoteSummary> {
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

  if (input.subjectId) {
    if (!mongoose.isValidObjectId(input.subjectId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid subject id',
      })
    }

    const subject = await Subject.findOne({
      _id: input.subjectId,
      userId,
    })

    if (!subject) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Subject not found',
      })
    }

    note.subjectId = subject._id
  } else {
    note.set('subjectId', null)
  }

  await Note.updateOne({ _id: note._id, userId }, { subjectId: note.subjectId })

  return toNoteSummary(note)
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
