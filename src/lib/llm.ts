import OpenAI from 'openai'

import { getLlmApiKey, getLlmBaseUrl, getLlmModel } from '@/lib/env'
import {
  noteTitlePrompt,
  notebookHtmlPrompt,
  structureNotesPrompt,
} from '@/lib/llm/prompts'
import { ensureA4NotebookHtml } from '@/lib/notebook-html'

type CompleteOptions = {
  temperature?: number
  maxTokens?: number
}

function createLlmClient() {
  const apiKey = getLlmApiKey()

  if (!apiKey) {
    throw new Error(
      'Set OPENAI_API_KEY or AI_GATEWAY_API_KEY for note generation',
    )
  }

  const baseURL = getLlmBaseUrl()

  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  })
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
  const model = getLlmModel()

  if (!model) {
    throw new Error('Set OPENAI_MODEL or AI_GATEWAY_MODEL for note generation')
  }

  const client = createLlmClient()
  const temperature = options.temperature ?? 0.35
  const maxTokens = options.maxTokens ?? 16_384

  const completion = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  return extractAssistantText(completion.choices[0]?.message?.content)
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
