import { createTRPCRouter } from '../init'

import { settingsRouter } from './settings/settings.router'

export const appRouter = createTRPCRouter({
  settings: settingsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
