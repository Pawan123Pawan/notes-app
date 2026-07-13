import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (url) => url.startsWith('mongodb://') || url.startsWith('mongodb+srv://'),
      { message: 'DATABASE_URL must be a MongoDB connection string' },
    ),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
})

function loadEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${message}`)
  }

  return parsed.data
}

export const env = loadEnv()

export function getAppUrl() {
  return env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL
}
