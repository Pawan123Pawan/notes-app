import type { CollectionConfig } from 'payload'

export const Logos: CollectionConfig = {
  slug: 'logos',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'width',
      type: 'number',
      required: true,
    },
    {
      name: 'height',
      type: 'number',
      required: true,
    },
  ],
}
