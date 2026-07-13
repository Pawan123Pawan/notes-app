import mongoose from 'mongoose'

import { env } from '@/lib/env'

import type { Db, MongoClient } from 'mongodb'

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
}

global.mongooseCache = cached

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.DATABASE_URL, {
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}

/** Native MongoDB client from the shared Mongoose connection (Better Auth adapter). */
export async function getAuthMongoClient(): Promise<MongoClient> {
  await connectDB()
  // Mongoose bundles its own mongodb types; cast at the Better Auth boundary.
  return mongoose.connection.getClient() as unknown as MongoClient
}

/** Native MongoDB database from the shared Mongoose connection (Better Auth adapter). */
export async function getAuthMongoDb(): Promise<Db> {
  await connectDB()
  const db = mongoose.connection.db

  if (!db) {
    throw new Error('MongoDB database is not available')
  }

  return db as unknown as Db
}
