import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

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
    rawTranscript: { type: String, required: true },
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

export const Note =
  (mongoose.models.Note as Model<NoteDocument> | undefined) ??
  mongoose.model<NoteDocument>('Note', noteSchema)
