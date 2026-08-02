import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import {
  createFolderInput,
  deleteFolderInput,
  getFolderByIdInput,
  listFolderTreeInput,
  moveFolderInput,
  reorderFoldersInput,
  updateFolderInput,
} from '@/trpc/routers/folders/folders.input'
import {
  createFolder,
  deleteFolder,
  getFolderById,
  listFolderTree,
  moveFolder,
  reorderFolders,
  updateFolder,
} from '@/trpc/routers/folders/folders.service'

export const foldersRouter = createTRPCRouter({
  listTree: protectedProcedure
    .input(listFolderTreeInput)
    .query(({ ctx, input }) => listFolderTree(ctx.user.id, input)),

  getById: protectedProcedure
    .input(getFolderByIdInput)
    .query(({ ctx, input }) => getFolderById(ctx.user.id, input)),

  create: protectedProcedure
    .input(createFolderInput)
    .mutation(({ ctx, input }) => createFolder(ctx.user.id, input)),

  update: protectedProcedure
    .input(updateFolderInput)
    .mutation(({ ctx, input }) => updateFolder(ctx.user.id, input)),

  move: protectedProcedure
    .input(moveFolderInput)
    .mutation(({ ctx, input }) => moveFolder(ctx.user.id, input)),

  reorder: protectedProcedure
    .input(reorderFoldersInput)
    .mutation(({ ctx, input }) => reorderFolders(ctx.user.id, input)),

  delete: protectedProcedure
    .input(deleteFolderInput)
    .mutation(({ ctx, input }) => deleteFolder(ctx.user.id, input)),
})
