import mongoose, { Schema, type InferSchemaType } from 'mongoose'

import { noteSourceTypes, noteStatuses } from '@/db/schema/note.constants'

const noteMetadataSchema = new Schema(
  {
    videoTitle: { type: String },
    channel: { type: String },
    duration: { type: Number },
  },
  { _id: false },
)

const noteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    title: { type: String, required: true, default: 'Untitled note' },
    sourceType: {
      type: String,
      enum: noteSourceTypes,
      required: true,
    },
    sourceUrl: { type: String },
    rawTranscript: { type: String, required: true, default: '' },
    structuredNotes: { type: String, default: '' },
    notebookHtml: { type: String, default: '' },
    status: {
      type: String,
      enum: noteStatuses,
      default: 'pending',
      index: true,
    },
    errorMessage: { type: String },
    metadata: {
      type: noteMetadataSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
)

noteSchema.index({ userId: 1, createdAt: -1 })
noteSchema.index({ userId: 1, subjectId: 1 })

export type NoteMetadata = InferSchemaType<typeof noteMetadataSchema>

export type NoteDocument = InferSchemaType<typeof noteSchema> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const NOTE_MODEL_NAME = 'Note'

// Next.js HMR keeps a previous compiled model on `mongoose.models`; drop it so
// schema changes (e.g. new sourceType enum values) apply without a full restart.
if (mongoose.models[NOTE_MODEL_NAME]) {
  mongoose.deleteModel(NOTE_MODEL_NAME)
}

export const Note = mongoose.model<NoteDocument>(NOTE_MODEL_NAME, noteSchema)
