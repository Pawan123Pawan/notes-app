import { TRPCError } from '@trpc/server'
import mongoose from 'mongoose'

import { connectDB } from '@/db'
import { Note } from '@/db/schema/note'
import { Subject, type SubjectDocument } from '@/db/schema/subject'
import { deleteFoldersForSubject } from '@/trpc/routers/folders/folders.service'

import type {
  CreateSubjectInput,
  DeleteSubjectInput,
  GetSubjectByIdInput,
  ReorderSubjectsInput,
  UpdateSubjectInput,
} from '@/trpc/routers/subjects/subjects.input'

export type SubjectSummary = {
  id: string
  name: string
  color?: string
  noteCount: number
  createdAt: Date
  updatedAt: Date
}

function toSubjectSummary(
  subject: SubjectDocument,
  noteCount: number,
): SubjectSummary {
  return {
    id: subject._id.toString(),
    name: subject.name,
    color: subject.color ?? undefined,
    noteCount,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  }
}

async function getNoteCountsBySubjectId(
  userId: string,
  subjectIds: mongoose.Types.ObjectId[],
) {
  if (subjectIds.length === 0) {
    return new Map<string, number>()
  }

  const counts = await Note.aggregate<{
    _id: mongoose.Types.ObjectId
    count: number
  }>([
    {
      $match: {
        userId,
        subjectId: { $in: subjectIds },
      },
    },
    {
      $group: {
        _id: '$subjectId',
        count: { $sum: 1 },
      },
    },
  ])

  return new Map(counts.map((row) => [row._id.toString(), row.count]))
}

async function requireSubject(
  userId: string,
  subjectId: string,
): Promise<SubjectDocument> {
  if (!mongoose.isValidObjectId(subjectId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid subject id',
    })
  }

  const subject = await Subject.findOne({
    _id: subjectId,
    userId,
  })

  if (!subject) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Subject not found',
    })
  }

  return subject
}

async function nextFrontSubjectSortOrder(userId: string): Promise<number> {
  const front = await Subject.findOne({
    userId,
    sortOrder: { $exists: true },
  })
    .sort({ sortOrder: 1 })
    .select('sortOrder')
    .lean()

  if (front && typeof front.sortOrder === 'number') {
    return front.sortOrder - 1
  }

  return 0
}

async function ensureSubjectsSortOrderBackfilled(userId: string) {
  const missing = await Subject.find({
    userId,
    sortOrder: { $exists: false },
  })
    .sort({ name: 1 })
    .select('_id')

  if (missing.length === 0) {
    return
  }

  await Promise.all(
    missing.map((subject, index) =>
      Subject.updateOne({ _id: subject._id }, { $set: { sortOrder: index } }),
    ),
  )
}

export async function listSubjects(userId: string): Promise<SubjectSummary[]> {
  await connectDB()

  await ensureSubjectsSortOrderBackfilled(userId)

  const subjects = await Subject.find({ userId }).sort({
    sortOrder: 1,
    name: 1,
  })
  const noteCounts = await getNoteCountsBySubjectId(
    userId,
    subjects.map((subject) => subject._id),
  )

  return subjects.map((subject) =>
    toSubjectSummary(subject, noteCounts.get(subject._id.toString()) ?? 0),
  )
}

export async function getSubjectById(
  userId: string,
  input: GetSubjectByIdInput,
): Promise<SubjectSummary> {
  await connectDB()

  const subject = await requireSubject(userId, input.subjectId)
  const noteCounts = await getNoteCountsBySubjectId(userId, [subject._id])

  return toSubjectSummary(subject, noteCounts.get(subject._id.toString()) ?? 0)
}

export async function createSubject(
  userId: string,
  input: CreateSubjectInput,
): Promise<SubjectSummary> {
  await connectDB()

  const sortOrder = await nextFrontSubjectSortOrder(userId)

  const subject = await Subject.create({
    userId,
    name: input.name,
    color: input.color,
    sortOrder,
  })

  return toSubjectSummary(subject, 0)
}

export async function updateSubject(
  userId: string,
  input: UpdateSubjectInput,
): Promise<SubjectSummary> {
  await connectDB()

  await requireSubject(userId, input.subjectId)

  const update: Record<string, unknown> = {}

  if (input.name !== undefined) {
    update.name = input.name
  }

  if (input.color !== undefined) {
    update.color = input.color ?? undefined
  }

  const subject = await Subject.findOneAndUpdate(
    { _id: input.subjectId, userId },
    { $set: update },
    { new: true },
  )

  if (!subject) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Subject not found',
    })
  }

  const noteCounts = await getNoteCountsBySubjectId(userId, [subject._id])

  return toSubjectSummary(subject, noteCounts.get(subject._id.toString()) ?? 0)
}

export async function deleteSubject(
  userId: string,
  input: DeleteSubjectInput,
): Promise<void> {
  await connectDB()

  const subject = await requireSubject(userId, input.subjectId)

  await Promise.all([
    Note.updateMany(
      { userId, subjectId: subject._id },
      { $unset: { subjectId: '', folderId: '' } },
    ),
    deleteFoldersForSubject(userId, subject._id),
    Subject.deleteOne({ _id: subject._id, userId }),
  ])
}

export async function reorderSubjects(
  userId: string,
  input: ReorderSubjectsInput,
): Promise<{ ok: true }> {
  await connectDB()

  await ensureSubjectsSortOrderBackfilled(userId)

  const uniqueIds = [...new Set(input.subjectIds)]

  if (uniqueIds.length !== input.subjectIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Duplicate subject ids in reorder list',
    })
  }

  for (const subjectId of uniqueIds) {
    if (!mongoose.isValidObjectId(subjectId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid subject id',
      })
    }
  }

  const subjects = await Subject.find({
    userId,
    _id: { $in: uniqueIds },
  }).select('_id')

  if (subjects.length !== uniqueIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'One or more subjects are missing',
    })
  }

  const ownedCount = await Subject.countDocuments({ userId })

  if (ownedCount !== uniqueIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Reorder list must include every subject',
    })
  }

  await Promise.all(
    input.subjectIds.map((subjectId, index) =>
      Subject.updateOne(
        { _id: subjectId, userId },
        { $set: { sortOrder: index } },
      ),
    ),
  )

  return { ok: true }
}
