import 'server-only'

import mongoose from 'mongoose'

import { env } from '@/lib/env'

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConn?: Promise<typeof mongoose>
}

export function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return Promise.resolve(mongoose)
  }

  if (!globalForMongoose.mongooseConn) {
    globalForMongoose.mongooseConn = mongoose
      .connect(env.DATABASE_URL)
      .then(() => mongoose)
  }

  return globalForMongoose.mongooseConn
}

export function getMongoDb() {
  return mongoose.connection.getClient().db()
}

export function getMongoClient() {
  return mongoose.connection.getClient()
}
