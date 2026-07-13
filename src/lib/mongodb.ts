import { env } from '@/lib/env'

import type { Db, MongoClient } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var mongoAuthClient: MongoClient | undefined
}

async function loadMongoClient() {
  const { MongoClient } = await import('mongodb')
  return MongoClient
}

export async function getAuthMongoClient() {
  if (!global.mongoAuthClient) {
    const MongoClient = await loadMongoClient()
    global.mongoAuthClient = new MongoClient(env.DATABASE_URL)
  }

  return global.mongoAuthClient
}

export async function getAuthMongoDb(): Promise<Db> {
  const client = await getAuthMongoClient()
  return client.db()
}
