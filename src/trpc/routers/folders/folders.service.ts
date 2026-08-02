import { TRPCError } from '@trpc/server'
import mongoose from 'mongoose'

import { connectDB } from '@/db'
import {
  Folder,
  MAX_FOLDER_DEPTH,
  type FolderDocument,
} from '@/db/schema/folder'
import { Note } from '@/db/schema/note'
import { Subject } from '@/db/schema/subject'

import type {
  CreateFolderInput,
  DeleteFolderInput,
  GetFolderByIdInput,
  ListFolderTreeInput,
  MoveFolderInput,
  ReorderFoldersInput,
  UpdateFolderInput,
} from '@/trpc/routers/folders/folders.input'

export type FolderTreeNode = {
  id: string
  subjectId: string
  parentId: string | null
  name: string
  sortOrder: number
  noteCount: number
  createdAt: Date
  updatedAt: Date
}

function toFolderTreeNode(
  folder: FolderDocument,
  noteCount: number,
): FolderTreeNode {
  return {
    id: folder._id.toString(),
    subjectId: folder.subjectId.toString(),
    parentId: folder.parentId?.toString() ?? null,
    name: folder.name,
    sortOrder: folder.sortOrder,
    noteCount,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  }
}

function parseObjectId(id: string, label: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid ${label}`,
    })
  }

  return new mongoose.Types.ObjectId(id)
}

async function requireSubject(userId: string, subjectId: string) {
  const subjectObjectId = parseObjectId(subjectId, 'subject id')

  const subject = await Subject.findOne({
    _id: subjectObjectId,
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

async function requireFolder(
  userId: string,
  folderId: string,
): Promise<FolderDocument> {
  const folderObjectId = parseObjectId(folderId, 'folder id')

  const folder = await Folder.findOne({
    _id: folderObjectId,
    userId,
  })

  if (!folder) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Folder not found',
    })
  }

  return folder
}

async function getNoteCountsByFolderId(
  userId: string,
  subjectId: mongoose.Types.ObjectId,
  folderIds: mongoose.Types.ObjectId[],
) {
  if (folderIds.length === 0) {
    return new Map<string, number>()
  }

  const counts = await Note.aggregate<{
    _id: mongoose.Types.ObjectId
    count: number
  }>([
    {
      $match: {
        userId,
        subjectId,
        folderId: { $in: folderIds },
      },
    },
    {
      $group: {
        _id: '$folderId',
        count: { $sum: 1 },
      },
    },
  ])

  return new Map(counts.map((row) => [row._id.toString(), row.count]))
}

async function nextFrontFolderSortOrder(
  userId: string,
  subjectId: mongoose.Types.ObjectId,
  parentId: mongoose.Types.ObjectId | null,
): Promise<number> {
  const front = await Folder.findOne({
    userId,
    subjectId,
    parentId,
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

/**
 * Depth of a folder: root (parentId null) = 1.
 * When parentId is null, the new folder would be depth 1.
 */
async function getDepthOfParent(
  userId: string,
  subjectId: mongoose.Types.ObjectId,
  parentId: mongoose.Types.ObjectId | null,
): Promise<number> {
  if (!parentId) {
    return 0
  }

  let depth = 0
  let currentId: mongoose.Types.ObjectId | null = parentId

  while (currentId) {
    depth += 1

    if (depth > MAX_FOLDER_DEPTH) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Folders can be nested at most ${MAX_FOLDER_DEPTH} levels deep`,
      })
    }

    const parent: Pick<FolderDocument, 'parentId'> | null =
      await Folder.findOne({
        _id: currentId,
        userId,
        subjectId,
      })
        .select('parentId')
        .lean()

    if (!parent) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Parent folder not found',
      })
    }

    currentId = parent.parentId ?? null
  }

  return depth
}

async function getSubtreeMaxDepthFromFolder(
  userId: string,
  subjectId: mongoose.Types.ObjectId,
  folderId: mongoose.Types.ObjectId,
): Promise<number> {
  const folders = await Folder.find({
    userId,
    subjectId,
  })
    .select('_id parentId')
    .lean()

  const childrenByParent = new Map<string, string[]>()

  for (const folder of folders) {
    const parentKey = folder.parentId?.toString() ?? 'root'
    const list = childrenByParent.get(parentKey) ?? []
    list.push(folder._id.toString())
    childrenByParent.set(parentKey, list)
  }

  function maxDepthBelow(id: string): number {
    const children = childrenByParent.get(id) ?? []
    if (children.length === 0) {
      return 1
    }

    return 1 + Math.max(...children.map((childId) => maxDepthBelow(childId)))
  }

  return maxDepthBelow(folderId.toString())
}

async function assertValidParent(
  userId: string,
  subjectId: mongoose.Types.ObjectId,
  parentId: string | null | undefined,
  options?: {
    movingFolderId?: mongoose.Types.ObjectId
    subtreeDepth?: number
  },
): Promise<mongoose.Types.ObjectId | null> {
  if (!parentId) {
    const subtreeDepth = options?.subtreeDepth ?? 1
    if (subtreeDepth > MAX_FOLDER_DEPTH) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Folders can be nested at most ${MAX_FOLDER_DEPTH} levels deep`,
      })
    }

    return null
  }

  const parentObjectId = parseObjectId(parentId, 'parent folder id')

  if (
    options?.movingFolderId &&
    parentObjectId.equals(options.movingFolderId)
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A folder cannot be its own parent',
    })
  }

  const parent = await Folder.findOne({
    _id: parentObjectId,
    userId,
    subjectId,
  })

  if (!parent) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Parent folder not found',
    })
  }

  if (options?.movingFolderId) {
    let currentId: mongoose.Types.ObjectId | null = parentObjectId

    while (currentId) {
      if (currentId.equals(options.movingFolderId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot move a folder into one of its descendants',
        })
      }

      const ancestor: Pick<FolderDocument, 'parentId'> | null =
        await Folder.findOne({
          _id: currentId,
          userId,
          subjectId,
        })
          .select('parentId')
          .lean()

      currentId = ancestor?.parentId ?? null
    }
  }

  const parentDepth = await getDepthOfParent(userId, subjectId, parentObjectId)
  const subtreeDepth = options?.subtreeDepth ?? 1
  const resultingDepth = parentDepth + subtreeDepth

  if (resultingDepth > MAX_FOLDER_DEPTH) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Folders can be nested at most ${MAX_FOLDER_DEPTH} levels deep`,
    })
  }

  return parentObjectId
}

export async function listFolderTree(
  userId: string,
  input: ListFolderTreeInput,
): Promise<FolderTreeNode[]> {
  await connectDB()

  const subject = await requireSubject(userId, input.subjectId)

  const folders = await Folder.find({
    userId,
    subjectId: subject._id,
  }).sort({ sortOrder: 1, name: 1 })

  const noteCounts = await getNoteCountsByFolderId(
    userId,
    subject._id,
    folders.map((folder) => folder._id),
  )

  return folders.map((folder) =>
    toFolderTreeNode(folder, noteCounts.get(folder._id.toString()) ?? 0),
  )
}

export async function getFolderById(
  userId: string,
  input: GetFolderByIdInput,
): Promise<FolderTreeNode> {
  await connectDB()

  const folder = await requireFolder(userId, input.folderId)
  const noteCounts = await getNoteCountsByFolderId(userId, folder.subjectId, [
    folder._id,
  ])

  return toFolderTreeNode(folder, noteCounts.get(folder._id.toString()) ?? 0)
}

export async function createFolder(
  userId: string,
  input: CreateFolderInput,
): Promise<FolderTreeNode> {
  await connectDB()

  const subject = await requireSubject(userId, input.subjectId)
  const parentObjectId = await assertValidParent(
    userId,
    subject._id,
    input.parentId ?? null,
  )

  const sortOrder = await nextFrontFolderSortOrder(
    userId,
    subject._id,
    parentObjectId,
  )

  const folder = await Folder.create({
    userId,
    subjectId: subject._id,
    parentId: parentObjectId,
    name: input.name,
    sortOrder,
  })

  return toFolderTreeNode(folder, 0)
}

export async function updateFolder(
  userId: string,
  input: UpdateFolderInput,
): Promise<FolderTreeNode> {
  await connectDB()

  await requireFolder(userId, input.folderId)

  const folder = await Folder.findOneAndUpdate(
    { _id: input.folderId, userId },
    { $set: { name: input.name } },
    { new: true },
  )

  if (!folder) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Folder not found',
    })
  }

  const noteCounts = await getNoteCountsByFolderId(userId, folder.subjectId, [
    folder._id,
  ])

  return toFolderTreeNode(folder, noteCounts.get(folder._id.toString()) ?? 0)
}

export async function moveFolder(
  userId: string,
  input: MoveFolderInput,
): Promise<FolderTreeNode> {
  await connectDB()

  const existing = await requireFolder(userId, input.folderId)
  const subtreeDepth = await getSubtreeMaxDepthFromFolder(
    userId,
    existing.subjectId,
    existing._id,
  )

  const parentObjectId = await assertValidParent(
    userId,
    existing.subjectId,
    input.parentId,
    {
      movingFolderId: existing._id,
      subtreeDepth,
    },
  )

  const sortOrder = await nextFrontFolderSortOrder(
    userId,
    existing.subjectId,
    parentObjectId,
  )

  const folder = await Folder.findOneAndUpdate(
    { _id: existing._id, userId },
    { $set: { parentId: parentObjectId, sortOrder } },
    { new: true },
  )

  if (!folder) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Folder not found',
    })
  }

  const noteCounts = await getNoteCountsByFolderId(userId, folder.subjectId, [
    folder._id,
  ])

  return toFolderTreeNode(folder, noteCounts.get(folder._id.toString()) ?? 0)
}

export async function reorderFolders(
  userId: string,
  input: ReorderFoldersInput,
): Promise<{ ok: true }> {
  await connectDB()

  const subject = await requireSubject(userId, input.subjectId)
  const parentObjectId = input.parentId
    ? parseObjectId(input.parentId, 'parent folder id')
    : null

  if (parentObjectId) {
    const parent = await Folder.findOne({
      _id: parentObjectId,
      userId,
      subjectId: subject._id,
    })

    if (!parent) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Parent folder not found',
      })
    }
  }

  const uniqueIds = [...new Set(input.folderIds)]

  if (uniqueIds.length !== input.folderIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Duplicate folder ids in reorder list',
    })
  }

  for (const folderId of uniqueIds) {
    parseObjectId(folderId, 'folder id')
  }

  const siblings = await Folder.find({
    userId,
    subjectId: subject._id,
    parentId: parentObjectId,
    _id: { $in: uniqueIds },
  }).select('_id')

  if (siblings.length !== uniqueIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'One or more folders are missing or not siblings',
    })
  }

  const siblingCount = await Folder.countDocuments({
    userId,
    subjectId: subject._id,
    parentId: parentObjectId,
  })

  if (siblingCount !== uniqueIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Reorder list must include every sibling folder',
    })
  }

  await Promise.all(
    input.folderIds.map((folderId, index) =>
      Folder.updateOne(
        { _id: folderId, userId },
        { $set: { sortOrder: index } },
      ),
    ),
  )

  return { ok: true }
}

export async function deleteFolder(
  userId: string,
  input: DeleteFolderInput,
): Promise<void> {
  await connectDB()

  const folder = await requireFolder(userId, input.folderId)
  const nextParentId = folder.parentId ?? null

  await Promise.all([
    Folder.updateMany(
      {
        userId,
        subjectId: folder.subjectId,
        parentId: folder._id,
      },
      { $set: { parentId: nextParentId } },
    ),
    Note.updateMany(
      {
        userId,
        subjectId: folder.subjectId,
        folderId: folder._id,
      },
      { $set: { folderId: nextParentId } },
    ),
    Folder.deleteOne({ _id: folder._id, userId }),
  ])
}

/** Used when deleting a subject: remove all folders for that subject. */
export async function deleteFoldersForSubject(
  userId: string,
  subjectId: mongoose.Types.ObjectId,
): Promise<void> {
  await Folder.deleteMany({ userId, subjectId })
}

/**
 * Validates that a folder belongs to the user and optionally the given subject.
 * Returns the folder ObjectId, or null when folderId is null/undefined.
 */
export async function resolveFolderIdForNote(
  userId: string,
  subjectId: mongoose.Types.ObjectId | null | undefined,
  folderId: string | null | undefined,
): Promise<mongoose.Types.ObjectId | null | undefined> {
  if (folderId === undefined) {
    return undefined
  }

  if (folderId === null) {
    return null
  }

  if (!subjectId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A subject is required to place a note in a folder',
    })
  }

  const folderObjectId = parseObjectId(folderId, 'folder id')

  const folder = await Folder.findOne({
    _id: folderObjectId,
    userId,
    subjectId,
  })

  if (!folder) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Folder not found in this subject',
    })
  }

  return folder._id
}
