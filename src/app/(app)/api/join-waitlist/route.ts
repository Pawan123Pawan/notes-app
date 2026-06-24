import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { z } from 'zod'

const joinWaitlistSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name'),
  email: z.email('Enter a valid email'),
  companyName: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  teamSize: z
    .enum(['1', '2-10', '11-50', '51-200', '201-1000', '1000+'])
    .optional(),
  useCase: z.string().optional(),
  consentToMarketing: z.boolean().optional(),
})

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

export async function POST(request: Request) {
  const json = (await request.json().catch(() => null)) as unknown
  const parsedInput = joinWaitlistSchema.safeParse(json)

  if (!parsedInput.success) {
    const firstIssue = parsedInput.error.issues[0]
    return NextResponse.json(
      { errors: [{ message: firstIssue?.message ?? 'Invalid request body.' }] },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'join-waitlist',
      data: {
        fullName: parsedInput.data.fullName.trim(),
        email: parsedInput.data.email.trim().toLowerCase(),
        companyName: normalizeOptionalText(parsedInput.data.companyName),
        jobTitle: normalizeOptionalText(parsedInput.data.jobTitle),
        teamSize: parsedInput.data.teamSize,
        useCase: normalizeOptionalText(parsedInput.data.useCase),
        consentToMarketing: parsedInput.data.consentToMarketing ?? false,
        consentToTerms: true,
        status: 'new',
      },
    })
  } catch (error) {
    const payloadError = error as {
      data?: {
        errors?: Array<{ message?: string }>
      }
    }
    const message =
      payloadError?.data?.errors?.[0]?.message ??
      'Could not submit waitlist form.'
    if (message.includes('unique')) {
      return NextResponse.json(
        { errors: [{ message: 'You are already on the waitlist.' }] },
        { status: 400 },
      )
    }
    return NextResponse.json({ errors: [{ message }] }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
