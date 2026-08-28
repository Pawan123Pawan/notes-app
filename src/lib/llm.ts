import OpenAI from 'openai'

import { getLlmApiKey, getLlmBaseUrl, getLlmModel } from '@/lib/env'
import { isLlmRateLimitError, toLlmError } from '@/lib/llm-errors'
import {
  noteTitlePrompt,
  notebookHtmlPrompt,
  structureNotesPrompt,
  videoQuizPrompt,
  type VideoQuizBatch,
} from '@/lib/llm/prompts'
import { ensureGeneratedHtml } from '@/lib/notebook-html'

type CompleteOptions = {
  temperature?: number
  maxTokens?: number
}

const QUIZ_BATCH_SIZE = 25
const QUIZ_BATCH_DELAY_MS = 750
const LLM_MAX_RETRIES = 4
const LLM_INITIAL_RETRY_DELAY_MS = 2_000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableLlmError(error: unknown) {
  if (isLlmRateLimitError(error)) {
    return true
  }

  if (!error || typeof error !== 'object' || !('status' in error)) {
    return false
  }

  const status = error.status

  return status === 503 || status === 500
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

  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      })

      return extractAssistantText(completion.choices[0]?.message?.content)
    } catch (error) {
      const shouldRetry =
        attempt < LLM_MAX_RETRIES && isRetryableLlmError(error)

      if (!shouldRetry) {
        throw toLlmError(error)
      }

      const delayMs = LLM_INITIAL_RETRY_DELAY_MS * 2 ** attempt
      await sleep(delayMs)
    }
  }

  throw new Error('LLM request failed after retries')
}

function countQuizQuestions(markdown: string) {
  const matches = markdown.match(/^### Q\d+\s*$/gm)
  return matches?.length ?? 0
}

function buildQuizPlan(totalMcqCount: number): VideoQuizBatch[] {
  const totalBatches = Math.ceil(totalMcqCount / QUIZ_BATCH_SIZE)
  const padWidth = totalMcqCount >= 1000 ? String(totalMcqCount).length : 0
  const batches: VideoQuizBatch[] = []

  for (let batchIndex = 1; batchIndex <= totalBatches; batchIndex++) {
    const startQuestion = (batchIndex - 1) * QUIZ_BATCH_SIZE + 1
    const endQuestion = Math.min(batchIndex * QUIZ_BATCH_SIZE, totalMcqCount)

    batches.push({
      batchIndex,
      totalBatches,
      startQuestion,
      endQuestion,
      totalMcqCount,
      padWidth,
    })
  }

  return batches
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
  mcqCount: number,
) {
  const preview = structuredNotes.slice(0, 4_000)
  const batches = buildQuizPlan(mcqCount)
  const batchResults: string[] = []

  for (const [index, batch] of batches.entries()) {
    if (index > 0) {
      await sleep(QUIZ_BATCH_DELAY_MS)
    }

    const batchMarkdown = await generateVideoQuizBatch(
      rawTranscript,
      preview,
      batch,
    )
    batchResults.push(batchMarkdown)
  }

  const merged = batchResults.join('\n\n')
  const totalCount = countQuizQuestions(merged)

  if (totalCount !== mcqCount) {
    throw new Error(
      `Video quiz generated ${totalCount} questions, expected ${mcqCount}`,
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

export async function renderNotebookHtml(
  structuredNotes: string,
  mcqCount: number,
) {
  const html = await complete(notebookHtmlPrompt(structuredNotes, mcqCount), {
    temperature: 0.45,
    maxTokens: 65_536,
  })
  return ensureGeneratedHtml(stripCodeFences(html))
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
