import { TRPCError } from '@trpc/server'
import mongoose from 'mongoose'

import { connectDB } from '@/db'
import { Note, type NoteDocument, type NoteMetadata } from '@/db/schema/note'
import type { NoteSourceType, NoteStatus } from '@/db/schema/note.constants'
import { Subject } from '@/db/schema/subject'
import {
  generateNoteTitle,
  renderNotebookHtml,
  structureTranscript,
} from '@/lib/llm'
import { getErrorMessage } from '@/lib/utils'
import { fetchYoutubeTranscript } from '@/lib/youtube'
import { resolveFolderIdForNote } from '@/trpc/routers/folders/folders.service'

import type {
  CreateNoteInput,
  GetNoteByIdInput,
  ListNotesInput,
  ReorderNotesInput,
  UpdateNoteFolderInput,
  UpdateNoteSubjectInput,
  UpdateNoteTitleInput,
} from '@/trpc/routers/notes/notes.input'

export type NoteSummary = {
  id: string
  title: string
  sourceType: NoteSourceType
  sourceUrl?: string
  status: NoteStatus
  subjectId?: string
  folderId?: string
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
    folderId: note.folderId?.toString(),
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

function subjectIdFilter(
  subjectId: string | null | undefined,
): Record<string, unknown> {
  if (subjectId === undefined) {
    return {}
  }

  if (subjectId === null) {
    return { subjectId: null }
  }

  return { subjectId: parseSubjectId(subjectId) }
}

function folderIdFilter(
  folderId: string | null | undefined,
): Record<string, unknown> {
  if (folderId === undefined) {
    return {}
  }

  if (folderId === null) {
    return { folderId: null }
  }

  if (!mongoose.isValidObjectId(folderId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid folder id',
    })
  }

  return { folderId: new mongoose.Types.ObjectId(folderId) }
}

async function nextFrontSortOrder(
  userId: string,
  subjectId: mongoose.Types.ObjectId | null | undefined,
  folderId: mongoose.Types.ObjectId | null | undefined = null,
): Promise<number> {
  const filter: Record<string, unknown> = {
    userId,
    sortOrder: { $exists: true },
  }

  if (subjectId === undefined || subjectId === null) {
    filter.subjectId = null
  } else {
    filter.subjectId = subjectId
  }

  if (folderId === undefined || folderId === null) {
    filter.folderId = null
  } else {
    filter.folderId = folderId
  }

  const front = await Note.findOne(filter)
    .sort({ sortOrder: 1 })
    .select('sortOrder')
    .lean()

  if (front && typeof front.sortOrder === 'number') {
    return front.sortOrder - 1
  }

  return 0
}

async function ensureNotesSortOrderBackfilled(
  userId: string,
  subjectId: string | null | undefined,
  folderId?: string | null,
) {
  const filter: Record<string, unknown> = {
    userId,
    sortOrder: { $exists: false },
    ...subjectIdFilter(subjectId),
    ...folderIdFilter(folderId),
  }

  const missing = await Note.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .select('_id')

  if (missing.length === 0) {
    return
  }

  await Promise.all(
    missing.map((note, index) =>
      Note.updateOne({ _id: note._id }, { $set: { sortOrder: index } }),
    ),
  )
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

  const subjectObjectId = parseSubjectId(input.subjectId)
  const folderObjectId =
    (await resolveFolderIdForNote(
      userId,
      subjectObjectId ?? null,
      input.folderId,
    )) ?? null
  const sortOrder = await nextFrontSortOrder(
    userId,
    subjectObjectId ?? null,
    folderObjectId,
  )

  if (input.sourceType === 'youtube') {
    const { videoId, transcript } = await fetchYoutubeTranscript(input.url)

    const note = await Note.create({
      userId,
      subjectId: subjectObjectId,
      folderId: folderObjectId,
      sourceType: 'youtube',
      sourceUrl: input.url,
      rawTranscript: transcript,
      metadata: {
        videoTitle: videoId,
      },
      status: 'pending',
      sortOrder,
    })

    scheduleNoteProcessing(note._id.toString())

    return {
      id: note._id.toString(),
      status: note.status,
    }
  }

  if (input.sourceType === 'html') {
    const note = await Note.create({
      userId,
      subjectId: subjectObjectId,
      folderId: folderObjectId,
      sourceType: 'html',
      title: input.title?.trim() || 'Imported notebook',
      rawTranscript: '(Imported HTML notebook)',
      structuredNotes: '',
      notebookHtml: input.notebookHtml,
      status: 'completed',
      sortOrder,
    })

    return {
      id: note._id.toString(),
      status: note.status,
    }
  }

  const note = await Note.create({
    userId,
    subjectId: subjectObjectId,
    folderId: folderObjectId,
    sourceType: input.sourceType,
    rawTranscript: input.transcript,
    status: 'pending',
    sortOrder,
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

  const applyFolderFilter = typeof input.subjectId === 'string'
  const folderFilter = applyFolderFilter ? folderIdFilter(input.folderId) : {}

  await ensureNotesSortOrderBackfilled(
    userId,
    input.subjectId,
    applyFolderFilter ? input.folderId : undefined,
  )

  const filter: Record<string, unknown> = {
    userId,
    ...subjectIdFilter(input.subjectId),
    ...folderFilter,
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
      const cursorSortOrder =
        typeof cursorNote.sortOrder === 'number' ? cursorNote.sortOrder : 0

      filter.$or = [
        { sortOrder: { $gt: cursorSortOrder } },
        {
          sortOrder: cursorSortOrder,
          createdAt: { $lt: cursorNote.createdAt },
        },
        {
          sortOrder: cursorSortOrder,
          createdAt: cursorNote.createdAt,
          _id: { $lt: cursorNote._id },
        },
      ]
    }
  }

  const notes = await Note.find(filter)
    .sort({ sortOrder: 1, createdAt: -1, _id: -1 })
    .limit(input.limit + 1)
    .select(
      'title sourceType sourceUrl status subjectId folderId metadata createdAt updatedAt sortOrder',
    )

  const hasMore = notes.length > input.limit
  const page = hasMore ? notes.slice(0, input.limit) : notes
  const nextCursor = hasMore ? page.at(-1)?._id.toString() : undefined

  return {
    items: page.map((note) => toNoteSummary(note)),
    nextCursor,
  }
}

export async function updateNoteTitle(
  userId: string,
  input: UpdateNoteTitleInput,
): Promise<NoteSummary> {
  if (!mongoose.isValidObjectId(input.noteId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid note id',
    })
  }

  await connectDB()

  const note = await Note.findOneAndUpdate(
    { _id: input.noteId, userId },
    { title: input.title },
    { new: true },
  )

  if (!note) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Note not found',
    })
  }

  return toNoteSummary(note)
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

  let nextSubjectId: mongoose.Types.ObjectId | null = null

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

    nextSubjectId = subject._id
  }

  const sortOrder = await nextFrontSortOrder(userId, nextSubjectId, null)

  await Note.updateOne(
    { _id: note._id, userId },
    { subjectId: nextSubjectId, folderId: null, sortOrder },
  )

  note.subjectId = nextSubjectId
  note.folderId = null
  note.sortOrder = sortOrder

  return toNoteSummary(note)
}

export async function updateNoteFolder(
  userId: string,
  input: UpdateNoteFolderInput,
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

  if (!note.subjectId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Assign the note to a subject before moving it into a folder',
    })
  }

  const nextFolderId =
    (await resolveFolderIdForNote(userId, note.subjectId, input.folderId)) ??
    null

  const sortOrder = await nextFrontSortOrder(
    userId,
    note.subjectId,
    nextFolderId,
  )

  await Note.updateOne(
    { _id: note._id, userId },
    { folderId: nextFolderId, sortOrder },
  )

  note.folderId = nextFolderId
  note.sortOrder = sortOrder

  return toNoteSummary(note)
}

export async function reorderNotes(
  userId: string,
  input: ReorderNotesInput,
): Promise<{ ok: true }> {
  await connectDB()

  const applyFolderFilter =
    typeof input.subjectId === 'string' && input.folderId !== undefined

  await ensureNotesSortOrderBackfilled(
    userId,
    input.subjectId,
    applyFolderFilter ? input.folderId : undefined,
  )

  const uniqueIds = [...new Set(input.noteIds)]

  if (uniqueIds.length !== input.noteIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Duplicate note ids in reorder list',
    })
  }

  for (const noteId of uniqueIds) {
    if (!mongoose.isValidObjectId(noteId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid note id',
      })
    }
  }

  const filter: Record<string, unknown> = {
    userId,
    _id: { $in: uniqueIds },
    ...subjectIdFilter(input.subjectId),
    ...(applyFolderFilter ? folderIdFilter(input.folderId) : {}),
  }

  const notes = await Note.find(filter).select('_id')

  if (notes.length !== uniqueIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'One or more notes are missing or not in this folder',
    })
  }

  await Promise.all(
    input.noteIds.map((noteId, index) =>
      Note.updateOne({ _id: noteId, userId }, { $set: { sortOrder: index } }),
    ),
  )

  return { ok: true }
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
