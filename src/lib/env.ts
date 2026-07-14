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

  /** Direct OpenAI API key. Used by the OpenAI SDK when set. */
  OPENAI_API_KEY: z.string().min(1).optional(),
  /** Model id for direct OpenAI (e.g. gpt-4o-mini). */
  OPENAI_MODEL: z.string().min(1).optional(),
  /** Optional OpenAI base URL override (defaults to https://api.openai.com/v1). */
  OPENAI_BASE_URL: z.string().url().optional(),

  /**
   * OpenAI-compatible API gateway key (e.g. Vercel AI Gateway).
   * Used by the OpenAI SDK when OPENAI_API_KEY is not set.
   */
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  AI_GATEWAY_MODEL: z.string().min(1).optional(),
  AI_GATEWAY_BASE_URL: z.string().url().optional(),

  /** @deprecated Prefer OPENAI_API_KEY or AI_GATEWAY_API_KEY. */
  GEMINI_API_KEY: z.string().min(1).optional(),

  /** Nodemailer SMTP (required in production to send reset emails). */
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
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

const defaultGeminiOpenAiCompatBaseUrl =
  'https://generativelanguage.googleapis.com/v1beta/openai'

const defaultOpenAiModel = 'gpt-4o-mini'

/**
 * API key passed to the OpenAI SDK.
 * Prefers direct OpenAI, then gateway, then legacy Gemini key.
 */
export function getLlmApiKey() {
  return (
    env.OPENAI_API_KEY ??
    env.AI_GATEWAY_API_KEY ??
    env.GEMINI_API_KEY ??
    undefined
  )
}

/**
 * Base URL for the OpenAI SDK.
 * - OPENAI_BASE_URL / AI_GATEWAY_BASE_URL when set
 * - omitted (SDK default) when using OPENAI_API_KEY
 * - Gemini OpenAI-compat URL when using a Gemini/gateway key without a base URL
 */
export function getLlmBaseUrl() {
  if (env.OPENAI_BASE_URL) {
    return env.OPENAI_BASE_URL
  }

  if (env.AI_GATEWAY_BASE_URL) {
    return env.AI_GATEWAY_BASE_URL
  }

  if (env.OPENAI_API_KEY) {
    return undefined
  }

  if (env.AI_GATEWAY_API_KEY || env.GEMINI_API_KEY) {
    return defaultGeminiOpenAiCompatBaseUrl
  }

  return undefined
}

export function getLlmModel() {
  return (
    env.OPENAI_MODEL ??
    env.AI_GATEWAY_MODEL ??
    (env.OPENAI_API_KEY ? defaultOpenAiModel : undefined)
  )
}

/** @deprecated Use getLlmApiKey */
export function getGeminiApiKey() {
  return getLlmApiKey()
}

/** @deprecated Use getLlmBaseUrl */
export function getGeminiBaseUrl() {
  return getLlmBaseUrl() ?? defaultGeminiOpenAiCompatBaseUrl
}

/** @deprecated Use getLlmModel */
export function getGeminiModel() {
  return getLlmModel()
}

/** @deprecated Use getLlmBaseUrl */
export function getAiGatewayBaseUrl() {
  return getLlmBaseUrl()
}
