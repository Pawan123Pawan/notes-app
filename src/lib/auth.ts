import 'server-only'

import { connectDB } from '@/db'
import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import type { Db, MongoClient } from 'mongodb'
import { env } from './env'

const mongoClient = await connectDB()
const mongoDb = mongoClient.db()

export const auth = betterAuth({
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.warn(`[auth] Password reset link for ${user.email}: ${url}`)
    },
  },
  socialProviders: {
    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined,
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  database: mongodbAdapter(mongoDb as unknown as Db, {
    client: mongoClient as unknown as MongoClient,
  }),
  plugins: [nextCookies()],
})
