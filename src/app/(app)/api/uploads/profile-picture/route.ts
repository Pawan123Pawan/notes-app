import { put } from '@vercel/blob'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif'])
const MAX_FILE_SIZE_BYTES = 1024 * 1024 // 1MB

function extensionForMimeType(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  if (type === 'image/gif') return 'gif'
  return 'bin'
}

export async function POST(request: Request) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Blob storage is not configured.' },
      { status: 500 },
    )
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Use a JPG, GIF, or PNG image.' },
      { status: 400 },
    )
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Image must be 1MB or smaller.' },
      { status: 400 },
    )
  }

  const extension = extensionForMimeType(file.type)
  const filename = `avatars/${session.user.id}/${crypto.randomUUID()}.${extension}`
  const blob = await put(filename, file, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  })

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    downloadUrl: blob.downloadUrl,
  })
}
