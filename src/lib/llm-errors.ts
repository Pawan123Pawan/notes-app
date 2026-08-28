export class LlmRateLimitError extends Error {
  constructor(
    message = 'AI rate limit reached. Wait a minute and try again, or lower the MCQ count.',
  ) {
    super(message)
    this.name = 'LlmRateLimitError'
  }
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  if (
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status
  }

  return undefined
}

export function isLlmRateLimitError(error: unknown) {
  if (error instanceof LlmRateLimitError) {
    return true
  }

  const status = getErrorStatus(error)

  if (status === 429) {
    return true
  }

  if (error instanceof Error) {
    return /429|rate limit|too many requests/i.test(error.message)
  }

  return false
}

export function toLlmError(error: unknown): Error {
  if (error instanceof Error) {
    if (isLlmRateLimitError(error) && !(error instanceof LlmRateLimitError)) {
      return new LlmRateLimitError()
    }

    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Note generation failed')
}
