import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import {
  clearAllReadInput,
  createNoteInput,
  deleteNoteInput,
  getNoteByIdInput,
  listNotesInput,
  markNoteViewedInput,
  reorderNotesInput,
  setNoteReadInput,
  updateNoteFolderInput,
  updateNoteSubjectInput,
  updateNoteTitleInput,
} from '@/trpc/routers/notes/notes.input'
import {
  clearAllRead,
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  markNoteViewed,
  reorderNotes,
  setNoteRead,
  updateNoteFolder,
  updateNoteSubject,
  updateNoteTitle,
} from '@/trpc/routers/notes/notes.service'

export const notesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createNoteInput)
    .mutation(({ ctx, input }) => createNote(ctx.user.id, input)),

  getById: protectedProcedure
    .input(getNoteByIdInput)
    .query(({ ctx, input }) => getNoteById(ctx.user.id, input)),

  list: protectedProcedure
    .input(listNotesInput)
    .query(({ ctx, input }) => listNotes(ctx.user.id, input)),

  delete: protectedProcedure
    .input(deleteNoteInput)
    .mutation(({ ctx, input }) => deleteNote(ctx.user.id, input.noteId)),

  updateSubject: protectedProcedure
    .input(updateNoteSubjectInput)
    .mutation(({ ctx, input }) => updateNoteSubject(ctx.user.id, input)),

  updateFolder: protectedProcedure
    .input(updateNoteFolderInput)
    .mutation(({ ctx, input }) => updateNoteFolder(ctx.user.id, input)),

  updateTitle: protectedProcedure
    .input(updateNoteTitleInput)
    .mutation(({ ctx, input }) => updateNoteTitle(ctx.user.id, input)),

  markViewed: protectedProcedure
    .input(markNoteViewedInput)
    .mutation(({ ctx, input }) => markNoteViewed(ctx.user.id, input)),

  setRead: protectedProcedure
    .input(setNoteReadInput)
    .mutation(({ ctx, input }) => setNoteRead(ctx.user.id, input)),

  clearAllRead: protectedProcedure
    .input(clearAllReadInput)
    .mutation(({ ctx, input }) => clearAllRead(ctx.user.id, input)),

  reorder: protectedProcedure
    .input(reorderNotesInput)
    .mutation(({ ctx, input }) => reorderNotes(ctx.user.id, input)),
})
