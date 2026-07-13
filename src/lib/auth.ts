import { createElement } from 'react'
import AuthAccountDeletionInitiatedEmail from '@/emails/auth-account-deletion-initiated'
import AuthNewLoginDetectedEmail from '@/emails/auth-new-login-detected'
import AuthPasswordChangedEmail from '@/emails/auth-password-changed'
import AuthTwoFactorStatusChangedEmail from '@/emails/auth-two-factor-status-changed'
import ResetPasswordEmail from '@/emails/reset-password'
import WelcomeEmail from '@/emails/welcome'
import { connectDB, getMongoClient, getMongoDb } from '@/db'
import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { twoFactor, admin } from 'better-auth/plugins'
import type { Db, MongoClient } from 'mongodb'
import { Resend } from 'resend'
import { env } from './env'

await connectDB()

export const auth = betterAuth({
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
        input: true,
      },
      timezone: {
        type: 'string',
        required: false,
        input: true,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!env.RESEND_API_KEY) {
        console.warn(
          '[auth] RESEND_API_KEY is not set; password reset email was not sent.',
        )
        return
      }
      const resend = new Resend(env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: user.email,
        subject: 'Reset your password',
        react: createElement(ResetPasswordEmail, { user, url }),
      })
      if (error) {
        throw new Error(error.message)
      }
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
  database: mongodbAdapter(getMongoDb() as unknown as Db, {
    client: getMongoClient() as unknown as MongoClient,
  }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path
      const hookContext = ctx.context as {
        newSession?: {
          user: {
            id: string
            email: string
            name?: string | null
          }
          session?: {
            ipAddress?: string | null
            userAgent?: string | null
          }
        }
        session?: {
          user: {
            id: string
            email: string
            name?: string | null
          }
        }
        runInBackgroundOrAwait: (task: Promise<unknown>) => Promise<unknown>
      }

      if (path.startsWith('/sign-up')) {
        const newSession = hookContext.newSession
        if (!newSession) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWelcomeEmail({
            id: newSession.user.id,
            email: newSession.user.email,
            name: newSession.user.name,
          }),
        )
        return
      }

      if (path.startsWith('/sign-in')) {
        const newSession = hookContext.newSession
        if (!newSession) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendSecurityEmail({
            to: newSession.user.email,
            userName: newSession.user.name,
            subject: 'New login detected',
            react: createElement(AuthNewLoginDetectedEmail, {
              userName: newSession.user.name,
              workspaceName: env.APP_NAME,
              device: newSession.session?.userAgent?.trim() || 'Unknown device',
              location: newSession.session?.ipAddress?.trim() || 'Unknown',
              loginAt: new Date().toUTCString(),
              securityUrl: `${env.NEXT_PUBLIC_APP_URL}/app/settings?tab=security`,
            }),
            idempotencyKey: `auth-new-login/${newSession.user.id}/${Date.now()}`,
          }),
        )
        return
      }

      if (path.includes('/change-password')) {
        const signedInUser = hookContext.session?.user
        if (!signedInUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendSecurityEmail({
            to: signedInUser.email,
            userName: signedInUser.name,
            subject: 'Password changed',
            react: createElement(AuthPasswordChangedEmail, {
              userName: signedInUser.name,
              workspaceName: env.APP_NAME,
              changedAt: new Date().toUTCString(),
              securityUrl: `${env.NEXT_PUBLIC_APP_URL}/app/settings?tab=security`,
            }),
            idempotencyKey: `auth-password-changed/${signedInUser.id}/${Date.now()}`,
          }),
        )
        return
      }

      if (
        path.includes('/two-factor/enable') ||
        path.includes('/two-factor/disable')
      ) {
        const signedInUser = hookContext.session?.user
        if (!signedInUser) {
          return
        }

        const status = path.includes('/enable') ? 'enabled' : 'disabled'
        await hookContext.runInBackgroundOrAwait(
          sendSecurityEmail({
            to: signedInUser.email,
            userName: signedInUser.name,
            subject: `Two-factor authentication ${status}`,
            react: createElement(AuthTwoFactorStatusChangedEmail, {
              userName: signedInUser.name,
              workspaceName: env.APP_NAME,
              status,
              changedAt: new Date().toUTCString(),
              securityUrl: `${env.NEXT_PUBLIC_APP_URL}/app/settings?tab=security`,
            }),
            idempotencyKey: `auth-two-factor-${status}/${signedInUser.id}/${Date.now()}`,
          }),
        )
        return
      }

      if (path.includes('/delete-user')) {
        const signedInUser = hookContext.session?.user
        if (!signedInUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendSecurityEmail({
            to: signedInUser.email,
            userName: signedInUser.name,
            subject: 'Account deletion initiated',
            react: createElement(AuthAccountDeletionInitiatedEmail, {
              userName: signedInUser.name,
              workspaceName: env.APP_NAME,
              requestedAt: new Date().toUTCString(),
              supportUrl: `${env.NEXT_PUBLIC_APP_URL}/support`,
            }),
            idempotencyKey: `auth-account-deletion/${signedInUser.id}/${Date.now()}`,
          }),
        )
      }
    }),
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: env.APP_NAME,
    }),
    admin(),
  ],
})

async function sendWelcomeEmail(user: {
  id: string
  email: string
  name?: string | null
}) {
  if (!env.RESEND_API_KEY) {
    console.warn(
      '[auth] RESEND_API_KEY is not set; welcome email was not sent.',
    )
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send(
    {
      from: env.RESEND_FROM,
      to: user.email,
      subject: `Welcome to ${env.APP_NAME}`,
      react: createElement(WelcomeEmail, {
        user,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      }),
    },
    { idempotencyKey: `welcome-email/${user.id}` },
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function sendSecurityEmail({
  to,
  subject,
  react,
  idempotencyKey,
}: {
  to: string
  userName?: string | null
  subject: string
  react: ReturnType<typeof createElement>
  idempotencyKey?: string
}) {
  if (!env.RESEND_API_KEY) {
    return
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send(
      {
        from: env.RESEND_FROM,
        to,
        subject,
        react,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    )

    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error(`[auth] Could not send ${subject} email`, error)
  }
}
