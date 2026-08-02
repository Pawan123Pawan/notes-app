import { z } from 'zod'

export const createSubjectInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
  color: z.string().trim().max(32).optional(),
})

export type CreateSubjectInput = z.infer<typeof createSubjectInput>

export const updateSubjectInput = z.object({
  subjectId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long')
    .optional(),
  color: z.string().trim().max(32).nullable().optional(),
})

export type UpdateSubjectInput = z.infer<typeof updateSubjectInput>

export const deleteSubjectInput = z.object({
  subjectId: z.string().min(1),
})

export type DeleteSubjectInput = z.infer<typeof deleteSubjectInput>

export const getSubjectByIdInput = z.object({
  subjectId: z.string().min(1),
})

export type GetSubjectByIdInput = z.infer<typeof getSubjectByIdInput>

export const reorderSubjectsInput = z.object({
  subjectIds: z.array(z.string().min(1)).min(1).max(100),
})

export type ReorderSubjectsInput = z.infer<typeof reorderSubjectsInput>
