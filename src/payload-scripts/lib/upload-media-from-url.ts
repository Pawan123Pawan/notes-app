import { getPayload } from 'payload'

const FALLBACK_IMAGE_MIME_TYPE = 'image/webp'

function getFileExtensionFromMimeType(mimeType: string) {
  const subtype = mimeType.split('/')[1]
  return subtype?.split(';')[0] ?? 'webp'
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

export async function uploadMediaFromUrl(
  payload: PayloadClient,
  {
    url,
    alt,
    fileNamePrefix,
  }: {
    url: string
    alt: string
    fileNamePrefix: string
  },
) {
  const existingMedia = await payload.find({
    collection: 'media',
    where: {
      alt: {
        equals: alt,
      },
    },
    limit: 1,
  })

  const existing = existingMedia.docs[0]
  if (existing) {
    return existing.id
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image "${alt}" from ${url}`)
  }

  const contentType =
    response.headers.get('content-type') ?? FALLBACK_IMAGE_MIME_TYPE
  const fileBuffer = Buffer.from(await response.arrayBuffer())
  const fileExtension = getFileExtensionFromMimeType(contentType)
  const fileName = `${slugify(fileNamePrefix)}.${fileExtension}`

  const uploadedMedia = await payload.create({
    collection: 'media',
    data: {
      alt,
    },
    file: {
      data: fileBuffer,
      mimetype: contentType,
      name: fileName,
      size: fileBuffer.length,
    },
  })

  return uploadedMedia.id
}
