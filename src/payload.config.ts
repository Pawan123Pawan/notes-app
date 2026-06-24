import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { HomepageTestimonials } from './collections/HomepageTestimonials'
import { Logos } from './collections/Logos'
import { Homepage } from './globals/Homepage'
import { Pricing } from './globals/Pricing'
import { Faqs } from './collections/Faqs'
import { Blog } from './collections/Blog'
import { BlogCategory } from './collections/BlogCategory'
import { JoinWaitlist } from './collections/JoinWaitlist'
import { env } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [
    Users,
    Media,
    HomepageTestimonials,
    Logos,
    Faqs,
    BlogCategory,
    Blog,
    JoinWaitlist,
  ],
  globals: [Homepage, Pricing],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({ pool: { connectionString: env.WEBSITE_DATABASE_URL } }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: { media: true },
      token: env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  email: resendAdapter({
    defaultFromAddress: env.RESEND_FROM,
    defaultFromName: env.APP_NAME,
    apiKey: env.RESEND_API_KEY ?? '',
  }),
})
