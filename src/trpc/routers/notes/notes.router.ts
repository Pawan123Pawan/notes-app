import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import {
  createNoteInput,
  deleteNoteInput,
  getNoteByIdInput,
  listNotesInput,
  updateNoteSubjectInput,
} from '@/trpc/routers/notes/notes.input'
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNoteSubject,
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
})
