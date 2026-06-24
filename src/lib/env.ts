import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod'

export const env = createEnv({
  server: {
    WEBSITE_DATABASE_URL: z.union([
      z.string().startsWith('postgresql://'),
      z.url(),
    ]),
    PAYLOAD_SECRET: z.string().min(24),
    APP_NAME: z.string().min(1).default('Micro SaaS Starter'),
    DATABASE_URL: z.union([z.string().startsWith('postgresql://'), z.url()]),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().optional().default('http://localhost:3000'),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    /** When unset, password reset emails are skipped (see `sendResetPassword` in `auth.ts`). */
    RESEND_API_KEY: z.string().optional(),
    /** Sender address, e.g. `Micro SaaS Starter <noreply@yourdomain.com>`. */
    RESEND_FROM: z
      .string()
      .min(1)
      .default('Micro SaaS Starter <onboarding@resend.dev>'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    WEBSITE_DATABASE_URL: process.env.WEBSITE_DATABASE_URL,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    APP_NAME: process.env.APP_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
  },
})
