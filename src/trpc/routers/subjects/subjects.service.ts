import { TRPCError } from '@trpc/server'
import mongoose from 'mongoose'

import { connectDB } from '@/db'
import { Note } from '@/db/schema/note'
import { Subject, type SubjectDocument } from '@/db/schema/subject'

import type {
  CreateSubjectInput,
  DeleteSubjectInput,
  GetSubjectByIdInput,
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

export async function listSubjects(userId: string): Promise<SubjectSummary[]> {
  await connectDB()

  const subjects = await Subject.find({ userId }).sort({ name: 1 })
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

  const subject = await Subject.create({
    userId,
    name: input.name,
    color: input.color,
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
      { $unset: { subjectId: '' } },
    ),
    Subject.deleteOne({ _id: subject._id, userId }),
  ])
}
