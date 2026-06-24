import * as z from 'zod'

export const submitOnboardingSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1, 'Please choose what best describes your role.'),
  toolsUsed: z.array(z.string().trim().min(1)).max(50).optional(),
  howFoundUs: z.string().trim().min(1, 'Please choose how you found us.'),
})
