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
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  /** @deprecated Use GEMINI_API_KEY. Kept for existing .env files. */
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  AI_GATEWAY_MODEL: z.string().min(1).optional(),
  /** Override Gemini OpenAI-compatible base URL if needed. */
  AI_GATEWAY_BASE_URL: z.string().url().optional(),
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

const defaultGeminiBaseUrl =
  'https://generativelanguage.googleapis.com/v1beta/openai'

export function getGeminiApiKey() {
  return env.GEMINI_API_KEY ?? env.AI_GATEWAY_API_KEY
}

export function getGeminiBaseUrl() {
  return env.AI_GATEWAY_BASE_URL ?? defaultGeminiBaseUrl
}

export function getGeminiModel() {
  return env.AI_GATEWAY_MODEL
}

/** @deprecated Use getGeminiBaseUrl */
export function getAiGatewayBaseUrl() {
  return getGeminiBaseUrl()
}
