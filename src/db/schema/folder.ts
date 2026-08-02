import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/** Maximum folder nesting depth within a subject (root = depth 1). */
export const MAX_FOLDER_DEPTH = 8

const folderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    name: { type: String, required: true, trim: true },
    sortOrder: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
)

folderSchema.index({ userId: 1, subjectId: 1 })
folderSchema.index({ userId: 1, subjectId: 1, parentId: 1, sortOrder: 1 })

export type FolderDocument = InferSchemaType<typeof folderSchema> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const FOLDER_MODEL_NAME = 'Folder'

if (mongoose.models[FOLDER_MODEL_NAME]) {
  mongoose.deleteModel(FOLDER_MODEL_NAME)
}

export const Folder =
  (mongoose.models[FOLDER_MODEL_NAME] as Model<FolderDocument> | undefined) ??
  mongoose.model<FolderDocument>(FOLDER_MODEL_NAME, folderSchema)
