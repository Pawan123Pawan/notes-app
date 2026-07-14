import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/env'

async function createAuth() {
  const { mongodbAdapter } = await import('better-auth/adapters/mongodb')
  const { getAuthMongoClient, getAuthMongoDb } = await import('@/db')

  const client = await getAuthMongoClient()
  const db = await getAuthMongoDb()

  return betterAuth({
    appName: 'Notes App',
    baseURL: getAppUrl(),
    database: mongodbAdapter(db, { client }),
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: 'Reset your Notes App password',
          text: [
            `Hi ${user.name || 'there'},`,
            '',
            'We received a request to reset your password.',
            `Open this link to choose a new password: ${url}`,
            '',
            'If you did not request this, you can ignore this email.',
          ].join('\n'),
          html: `
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to reset your password.</p>
            <p><a href="${url}">Reset your password</a></p>
            <p>If you did not request this, you can ignore this email.</p>
          `,
        })
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      sendVerificationEmail: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: 'Verify your Notes App email',
          text: [
            `Hi ${user.name || 'there'},`,
            '',
            `Verify your email by opening this link: ${url}`,
          ].join('\n'),
          html: `
            <p>Hi ${user.name || 'there'},</p>
            <p><a href="${url}">Verify your email</a></p>
          `,
        })
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
