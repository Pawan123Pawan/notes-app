import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { submitOnboardingSchema } from './onboarding.input'
import {
  getUserOnboardingForClient,
  upsertUserOnboarding,
} from './onboarding.service'

export const onboardingRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getUserOnboardingForClient(ctx.user.id)
  }),
  submit: protectedProcedure
    .input(submitOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      await upsertUserOnboarding(ctx.user.id, input)
      return { success: true }
    }),
})
