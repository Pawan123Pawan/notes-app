import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

import { getAppUrl } from '@/lib/env'

async function createAuth() {
  const { mongodbAdapter } = await import('better-auth/adapters/mongodb')
  const { getAuthMongoClient, getAuthMongoDb } = await import('@/lib/mongodb')

  const client = await getAuthMongoClient()
  const db = await getAuthMongoDb()

  return betterAuth({
    appName: 'Notes App',
    baseURL: getAppUrl(),
    database: mongodbAdapter(db, { client }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        console.log(`[auth] Password reset for ${user.email}: ${url}`)
      },
      onPasswordReset: async ({ user }) => {
        console.log(`[auth] Password reset completed for ${user.email}`)
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      sendVerificationEmail: async ({ user, url }) => {
        console.log(`[auth] Verify email for ${user.email}: ${url}`)
      },
    },
    plugins: [nextCookies()],
  })
}

type AuthInstance = Awaited<ReturnType<typeof createAuth>>

let authInstance: AuthInstance | null = null

export async function getAuth() {
  if (!authInstance) {
    authInstance = await createAuth()
  }

  return authInstance
}

export type Session = AuthInstance['$Infer']['Session']
