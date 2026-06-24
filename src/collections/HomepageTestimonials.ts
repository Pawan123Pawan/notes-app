import type { CollectionConfig } from 'payload'

export const HomepageTestimonials: CollectionConfig = {
  slug: 'homepage-testimonials',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'byline', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'byline',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'text',
      required: true,
    },
  ],
}
