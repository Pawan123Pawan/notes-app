import type { CollectionConfig } from 'payload'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  defaultSort: 'order',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['order', 'question', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'order',
      type: 'number',
      required: true,
      index: true,
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first.',
      },
    },
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
    },
  ],
}
