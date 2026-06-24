import { createAuthClient } from 'better-auth/react'
import { twoFactorClient, adminClient } from 'better-auth/client/plugins'
import { env } from './env'

/** Public app origin for OAuth/password-reset callbacks (matches `NEXT_PUBLIC_APP_URL`). */
export const authPublicUrl = env.NEXT_PUBLIC_APP_URL

export const authClient = createAuthClient({
  baseURL: authPublicUrl,
  plugins: [twoFactorClient(), adminClient()],
})
