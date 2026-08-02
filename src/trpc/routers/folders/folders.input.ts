import { z } from 'zod'

export const listFolderTreeInput = z.object({
  subjectId: z.string().min(1),
})

export type ListFolderTreeInput = z.infer<typeof listFolderTreeInput>

export const createFolderInput = z.object({
  subjectId: z.string().min(1),
  parentId: z.string().min(1).nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
})

export type CreateFolderInput = z.infer<typeof createFolderInput>

export const updateFolderInput = z.object({
  folderId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
})

export type UpdateFolderInput = z.infer<typeof updateFolderInput>

export const moveFolderInput = z.object({
  folderId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
})

export type MoveFolderInput = z.infer<typeof moveFolderInput>

export const reorderFoldersInput = z.object({
  subjectId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  folderIds: z.array(z.string().min(1)).min(1).max(100),
})

export type ReorderFoldersInput = z.infer<typeof reorderFoldersInput>

export const deleteFolderInput = z.object({
  folderId: z.string().min(1),
})

export type DeleteFolderInput = z.infer<typeof deleteFolderInput>

export const getFolderByIdInput = z.object({
  folderId: z.string().min(1),
})

export type GetFolderByIdInput = z.infer<typeof getFolderByIdInput>
