import type { CollectionConfig } from 'payload'

export const Blog: CollectionConfig = {
  slug: 'blogs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'author', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  defaultSort: '-createdAt',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
        {
          label: 'Scheduled',
          value: 'scheduled',
        },
      ],
    },
    {
      name: 'scheduledAt',
      type: 'date',
      admin: {
        condition: (_, siblingData) => siblingData?.status === 'scheduled',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'blog-categories',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'readingTimeMinutes',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'metaTitle',
      type: 'text',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
    },
    {
      name: 'metaKeywords',
      type: 'array',
      fields: [
        {
          name: 'keyword',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'canonicalUrl',
      type: 'text',
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'structuredData',
      type: 'json',
      admin: {
        description:
          'Custom JSON-LD schema data for this blog post (Article, FAQPage, HowTo, etc.).',
      },
    },
  ],
  timestamps: true,
}
