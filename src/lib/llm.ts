import { getGeminiApiKey, getGeminiBaseUrl, getGeminiModel } from '@/lib/env'
import {
  noteTitlePrompt,
  notebookHtmlPrompt,
  structureNotesPrompt,
} from '@/lib/llm/prompts'
import { ensureA4NotebookHtml } from '@/lib/notebook-html'

type GeminiError = {
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

type ChatCompletionResponse = GeminiError & {
  choices?: Array<{ message?: { content?: string | null } }>
}

type CompleteOptions = {
  temperature?: number
  maxTokens?: number
}

function getGeminiAuthHeaders(apiKey: string): HeadersInit {
  // Gemini's OpenAI-compatible endpoint expects Authorization: Bearer.
  // x-goog-api-key alone returns 400 "Missing or invalid Authorization header".
  return { Authorization: `Bearer ${apiKey}` }
}

function parseGeminiError(body: unknown, status: number) {
  const payload = Array.isArray(body) ? body[0] : body
  const geminiError = payload as GeminiError
  const message = geminiError.error?.message

  if (message) {
    return message
  }

  return `Gemini request failed (${status})`
}

function extractAssistantText(content: string | null | undefined) {
  if (!content?.trim()) {
    throw new Error('LLM returned an empty response')
  }

  return content.trim()
}

function stripCodeFences(value: string) {
  const fenced = value.match(/^```(?:html)?\s*([\s\S]*?)```$/i)
  return fenced ? fenced[1].trim() : value.trim()
}

async function complete(prompt: string, options: CompleteOptions = {}) {
  const apiKey = getGeminiApiKey()

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const baseUrl = getGeminiBaseUrl().replace(/\/$/, '')
  const model = getGeminiModel()
  const temperature = options.temperature ?? 0.35
  const maxTokens = options.maxTokens ?? 16_384

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getGeminiAuthHeaders(apiKey),
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const body = (await response.json()) as unknown

  if (!response.ok) {
    throw new Error(parseGeminiError(body, response.status))
  }

  const payload = (
    Array.isArray(body) ? body[0] : body
  ) as ChatCompletionResponse

  return extractAssistantText(payload.choices?.[0]?.message?.content)
}

export async function structureTranscript(rawTranscript: string) {
  return complete(structureNotesPrompt(rawTranscript), {
    temperature: 0.3,
    maxTokens: 16_384,
  })
}

export async function renderNotebookHtml(structuredNotes: string) {
  const html = await complete(notebookHtmlPrompt(structuredNotes), {
    temperature: 0.45,
    maxTokens: 24_576,
  })
  return ensureA4NotebookHtml(stripCodeFences(html))
}

export async function generateNoteTitle(structuredNotes: string) {
  const preview = structuredNotes.slice(0, 500)
  const title = await complete(noteTitlePrompt(preview), {
    temperature: 0.2,
    maxTokens: 128,
  })
  return title.replace(/^["']|["']$/g, '').slice(0, 60)
}
