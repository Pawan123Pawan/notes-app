import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import {
  createSubjectInput,
  deleteSubjectInput,
  getSubjectByIdInput,
  updateSubjectInput,
} from '@/trpc/routers/subjects/subjects.input'
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  listSubjects,
  updateSubject,
} from '@/trpc/routers/subjects/subjects.service'

export const subjectsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listSubjects(ctx.user.id)),

  getById: protectedProcedure
    .input(getSubjectByIdInput)
    .query(({ ctx, input }) => getSubjectById(ctx.user.id, input)),

  create: protectedProcedure
    .input(createSubjectInput)
    .mutation(({ ctx, input }) => createSubject(ctx.user.id, input)),

  update: protectedProcedure
    .input(updateSubjectInput)
    .mutation(({ ctx, input }) => updateSubject(ctx.user.id, input)),

  delete: protectedProcedure
    .input(deleteSubjectInput)
    .mutation(({ ctx, input }) => deleteSubject(ctx.user.id, input)),
})
