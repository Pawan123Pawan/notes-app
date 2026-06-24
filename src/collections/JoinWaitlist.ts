import { createElement } from 'react'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { Resend } from 'resend'
import WaitlistJoinedEmail from '@/emails/waitlist-joined'
import { env } from '@/lib/env'

const sendWaitlistJoinedEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
}) => {
  if (operation !== 'create') {
    return
  }

  if (!env.RESEND_API_KEY) {
    console.warn(
      '[join-waitlist] RESEND_API_KEY is not set; waitlist thank-you email was not sent.',
    )
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send(
    {
      from: env.RESEND_FROM,
      to: doc.email,
      subject: `Thanks for joining the ${env.APP_NAME} waitlist`,
      react: createElement(WaitlistJoinedEmail, {
        fullName: doc.fullName,
        email: doc.email,
        appName: env.APP_NAME,
      }),
    },
    { idempotencyKey: `waitlist-thanks/${doc.id}` },
  )

  if (error) {
    throw new Error(error.message)
  }
}

export const JoinWaitlist: CollectionConfig = {
  slug: 'join-waitlist',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'companyName', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'companyName',
      type: 'text',
    },
    {
      name: 'jobTitle',
      type: 'text',
    },
    {
      name: 'companyWebsite',
      type: 'text',
    },
    {
      name: 'teamSize',
      type: 'select',
      options: [
        {
          label: 'Just me',
          value: '1',
        },
        {
          label: '2-10',
          value: '2-10',
        },
        {
          label: '11-50',
          value: '11-50',
        },
        {
          label: '51-200',
          value: '51-200',
        },
        {
          label: '201-1000',
          value: '201-1000',
        },
        {
          label: '1000+',
          value: '1000+',
        },
      ],
    },
    {
      name: 'useCase',
      type: 'textarea',
    },
    {
      name: 'biggestChallenge',
      type: 'textarea',
    },
    {
      name: 'expectedMonthlyVolume',
      type: 'number',
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'Contacted',
          value: 'contacted',
        },
        {
          label: 'Invited',
          value: 'invited',
        },
        {
          label: 'Converted',
          value: 'converted',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Medium',
          value: 'medium',
        },
        {
          label: 'High',
          value: 'high',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'consentToTerms',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      admin: {
        description:
          'User accepted terms and privacy policy during waitlist signup.',
      },
    },
    {
      name: 'consentToMarketing',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'attribution',
      type: 'group',
      fields: [
        {
          name: 'source',
          type: 'text',
          admin: {
            description:
              'High-level acquisition source (e.g. organic, referral, ad).',
          },
        },
        {
          name: 'campaign',
          type: 'text',
        },
        {
          name: 'utmSource',
          type: 'text',
        },
        {
          name: 'utmMedium',
          type: 'text',
        },
        {
          name: 'utmCampaign',
          type: 'text',
        },
        {
          name: 'utmTerm',
          type: 'text',
        },
        {
          name: 'utmContent',
          type: 'text',
        },
        {
          name: 'referrer',
          type: 'text',
        },
      ],
    },
    {
      name: 'technicalMetadata',
      type: 'group',
      fields: [
        {
          name: 'ipAddress',
          type: 'text',
        },
        {
          name: 'userAgent',
          type: 'textarea',
        },
        {
          name: 'locale',
          type: 'text',
        },
        {
          name: 'timezone',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [sendWaitlistJoinedEmail],
  },
  timestamps: true,
}
