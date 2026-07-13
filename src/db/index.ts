import 'server-only'

import { MongoClient } from 'mongodb'

import { env } from '@/lib/env'

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient
  mongoClientPromise?: Promise<MongoClient>
}

function getClientPromise() {
  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = MongoClient.connect(
      env.DATABASE_URL,
    ).then((client) => {
      globalForMongo.mongoClient = client
      return client
    })
  }

  return globalForMongo.mongoClientPromise
}

export async function connectDB() {
  return getClientPromise()
}

export async function getMongoClient() {
  return connectDB()
}

export async function getMongoDb() {
  const client = await connectDB()
  return client.db()
}
