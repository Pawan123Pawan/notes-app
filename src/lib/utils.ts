import { clsx, type ClassValue } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import * as z from 'zod'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(
  error: unknown,
  defaultMessage: string = 'An unknown error occurred',
) {
  let errorMessage = defaultMessage
  if (error instanceof z.ZodError) {
    errorMessage = error.issues.map((issue) => issue.message).join(', ')
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string' || typeof error === 'number') {
    errorMessage = String(error)
  }
  return errorMessage
}

export function showErrorToast(
  title: string,
  error: unknown,
  defaultMessage: string = 'An unknown error occurred',
) {
  const errorMessage = getErrorMessage(error, defaultMessage)
  toast.error(title, {
    description: errorMessage,
  })
}
