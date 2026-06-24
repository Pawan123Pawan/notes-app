import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { userOnboarding } from '@/db/schema'

export async function getUserOnboarding(userId: string) {
  const [onboarding] = await db
    .select({
      role: userOnboarding.role,
      toolsUsed: userOnboarding.toolsUsed,
      howFoundUs: userOnboarding.howFoundUs,
      completedAt: userOnboarding.completedAt,
    })
    .from(userOnboarding)
    .where(eq(userOnboarding.userId, userId))
    .limit(1)

  return onboarding ?? null
}

export async function getUserOnboardingForClient(userId: string) {
  const onboarding = await getUserOnboarding(userId)
  if (!onboarding) {
    return null
  }

  return {
    ...onboarding,
    toolsUsed: onboarding.toolsUsed
      ? onboarding.toolsUsed
          .split(',')
          .map((tool) => tool.trim())
          .filter(Boolean)
      : [],
  }
}

export async function upsertUserOnboarding(
  userId: string,
  input: { role: string; toolsUsed?: string[]; howFoundUs: string },
) {
  const now = new Date()
  const toolsUsed = (input.toolsUsed ?? []).map((tool) => tool.trim())
  const toolsUsedValue = toolsUsed.length ? toolsUsed.join(',') : null

  await db
    .insert(userOnboarding)
    .values({
      userId,
      role: input.role,
      toolsUsed: toolsUsedValue,
      howFoundUs: input.howFoundUs,
      completedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userOnboarding.userId,
      set: {
        role: input.role,
        toolsUsed: toolsUsedValue,
        howFoundUs: input.howFoundUs,
        completedAt: now,
        updatedAt: now,
      },
    })
}

export async function isUserOnboarded(userId: string) {
  const onboarding = await getUserOnboarding(userId)
  return Boolean(onboarding?.role && onboarding?.howFoundUs)
}
