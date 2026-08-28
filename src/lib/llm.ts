import OpenAI from 'openai'

import { getLlmApiKey, getLlmBaseUrl, getLlmModel } from '@/lib/env'
import {
  noteTitlePrompt,
  notebookHtmlPrompt,
  structureNotesPrompt,
  videoQuizPrompt,
  type VideoQuizBatch,
} from '@/lib/llm/prompts'
import { ensureA4NotebookHtml } from '@/lib/notebook-html'

type CompleteOptions = {
  temperature?: number
  maxTokens?: number
}

const QUIZ_BATCH_SIZE = 25
const QUIZ_TOTAL_QUESTIONS = 100
const QUIZ_TOTAL_BATCHES = QUIZ_TOTAL_QUESTIONS / QUIZ_BATCH_SIZE

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

function countQuizQuestions(markdown: string) {
  const matches = markdown.match(/^### Q\d{3}\s*$/gm)
  return matches?.length ?? 0
}

function buildQuizBatch(batchIndex: number): VideoQuizBatch {
  const startQuestion = (batchIndex - 1) * QUIZ_BATCH_SIZE + 1
  const endQuestion = batchIndex * QUIZ_BATCH_SIZE

  return {
    batchIndex,
    totalBatches: QUIZ_TOTAL_BATCHES,
    startQuestion,
    endQuestion,
  }
}

async function generateVideoQuizBatch(
  rawTranscript: string,
  structuredNotesPreview: string,
  batch: VideoQuizBatch,
  isRetry = false,
): Promise<string> {
  const expectedCount = batch.endQuestion - batch.startQuestion + 1
  const result = await complete(
    videoQuizPrompt(rawTranscript, structuredNotesPreview, batch),
    {
      temperature: 0.35,
      maxTokens: 8_192,
    },
  )

  const actualCount = countQuizQuestions(result)

  if (actualCount !== expectedCount && !isRetry) {
    return generateVideoQuizBatch(
      rawTranscript,
      structuredNotesPreview,
      batch,
      true,
    )
  }

  if (actualCount !== expectedCount) {
    throw new Error(
      `Video quiz batch ${batch.batchIndex}/${batch.totalBatches} produced ${actualCount} questions, expected ${expectedCount}`,
    )
  }

  return result
}

export async function generateVideoQuiz(
  rawTranscript: string,
  structuredNotes: string,
) {
  const preview = structuredNotes.slice(0, 4_000)
  const batches: string[] = []

  for (let i = 1; i <= QUIZ_TOTAL_BATCHES; i++) {
    const batch = buildQuizBatch(i)
    const batchMarkdown = await generateVideoQuizBatch(
      rawTranscript,
      preview,
      batch,
    )
    batches.push(batchMarkdown)
  }

  const merged = batches.join('\n\n')
  const totalCount = countQuizQuestions(merged)

  if (totalCount !== QUIZ_TOTAL_QUESTIONS) {
    throw new Error(
      `Video quiz generated ${totalCount} questions, expected ${QUIZ_TOTAL_QUESTIONS}`,
    )
  }

  return merged
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
    maxTokens: 65_536,
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

export function mergeNotesWithQuiz(structuredNotes: string, videoQuiz: string) {
  return `${structuredNotes.trim()}\n\n${videoQuiz.trim()}`
}
