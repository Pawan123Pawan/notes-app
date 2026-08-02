import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

const subjectSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String },
    sortOrder: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
)

subjectSchema.index({ userId: 1, name: 1 })
subjectSchema.index({ userId: 1, sortOrder: 1 })

export type SubjectDocument = InferSchemaType<typeof subjectSchema> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Subject =
  (mongoose.models.Subject as Model<SubjectDocument> | undefined) ??
  mongoose.model<SubjectDocument>('Subject', subjectSchema)
