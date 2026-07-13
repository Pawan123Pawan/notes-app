import OpenAI from 'openai'

import { env, getAiGatewayBaseUrl } from '@/lib/env'
import {
  noteTitlePrompt,
  notebookHtmlPrompt,
  structureNotesPrompt,
} from '@/lib/llm/prompts'

const defaultModel = 'openai/gpt-4o'

function getAiClient() {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new Error('AI_GATEWAY_API_KEY is not configured')
  }

  return new OpenAI({
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: getAiGatewayBaseUrl(),
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

async function complete(prompt: string) {
  const client = getAiClient()
  const response = await client.chat.completions.create({
    model: defaultModel,
    messages: [{ role: 'user', content: prompt }],
  })

  return extractAssistantText(response.choices[0]?.message?.content)
}

export async function structureTranscript(rawTranscript: string) {
  return complete(structureNotesPrompt(rawTranscript))
}

export async function renderNotebookHtml(structuredNotes: string) {
  const html = await complete(notebookHtmlPrompt(structuredNotes))
  return stripCodeFences(html)
}

export async function generateNoteTitle(structuredNotes: string) {
  const preview = structuredNotes.slice(0, 500)
  const title = await complete(noteTitlePrompt(preview))
  return title.replace(/^["']|["']$/g, '').slice(0, 60)
}
