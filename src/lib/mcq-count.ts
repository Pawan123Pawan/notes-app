import { z } from 'zod'

export const mcqCountSchema = z.coerce
  .number({ error: 'MCQ count is required' })
  .int('MCQ count must be a whole number')
  .positive('MCQ count must be at least 1')
