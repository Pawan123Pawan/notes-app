import { toNextJsHandler } from 'better-auth/next-js'

import { getAuth } from '@/lib/auth'

export const runtime = 'nodejs'

type NextAuthHandler = ReturnType<typeof toNextJsHandler>

let handler: NextAuthHandler | undefined

async function getHandler() {
  if (!handler) {
    const auth = await getAuth()
    handler = toNextJsHandler(auth)
  }

  return handler
}

export async function GET(request: Request) {
  return (await getHandler()).GET(request)
}

export async function POST(request: Request) {
  return (await getHandler()).POST(request)
}

export async function PATCH(request: Request) {
  return (await getHandler()).PATCH(request)
}

export async function PUT(request: Request) {
  return (await getHandler()).PUT(request)
}

export async function DELETE(request: Request) {
  return (await getHandler()).DELETE(request)
}
