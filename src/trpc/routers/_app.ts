import { createTRPCRouter } from '../init'
import { notificationRouter } from './notification.router'
import { onboardingRouter } from './onboarding.router'
import { settingsRouter } from './settings.router'
import { workspacesRouter } from './workspaces.router'

export const appRouter = createTRPCRouter({
  notification: notificationRouter,
  onboarding: onboardingRouter,
  settings: settingsRouter,
  workspaces: workspacesRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
