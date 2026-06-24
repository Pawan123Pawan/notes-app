import * as z from 'zod'

export const workspaceSlugSchema = z.object({
  workspaceSlug: z.string().min(1, 'Workspace slug is required.'),
})

export const bulkMarkNotificationsSchema = workspaceSlugSchema
  .extend({
    all: z.boolean().optional(),
    notificationIds: z.array(z.string().min(1)).optional(),
    markAs: z.enum(['read', 'unread']),
  })
  .superRefine((value, context) => {
    if (
      !value.all &&
      (!value.notificationIds || value.notificationIds.length < 1)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one notification id or set all=true.',
      })
    }
  })

export const bulkDeleteNotificationsSchema = workspaceSlugSchema
  .extend({
    all: z.boolean().optional(),
    notificationIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((value, context) => {
    if (
      !value.all &&
      (!value.notificationIds || value.notificationIds.length < 1)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one notification id or set all=true.',
      })
    }
  })
