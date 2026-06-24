import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Blog, Media } from '@/payload-types'
import { Main } from '@/components/website/elements/main'
import { Section } from '@/components/website/elements/section'
import { env } from '@/lib/env'

const BLOG_PAGE_TITLE = `Blog | ${env.APP_NAME}`
const BLOG_PAGE_DESCRIPTION =
  'Insights, guides, and practical playbooks for shipping AI-native SaaS products faster.'

function resolveMediaUrl(media: number | Media | string | null | undefined) {
  if (typeof media === 'string') return media
  if (typeof media === 'object' && media?.url) return media.url
  return ''
}

async function getPublishedBlogs() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-createdAt',
    depth: 2,
    limit: 100,
  })

  return result.docs as Blog[]
}

export const metadata: Metadata = {
  title: BLOG_PAGE_TITLE,
  description: BLOG_PAGE_DESCRIPTION,
  keywords: [
    'AI native starter kit',
    'microSaaS blog',
    'SaaS launch guides',
    'startup execution',
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: BLOG_PAGE_TITLE,
    description: BLOG_PAGE_DESCRIPTION,
    type: 'website',
    url: `${env.NEXT_PUBLIC_APP_URL}/blog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: BLOG_PAGE_TITLE,
    description: BLOG_PAGE_DESCRIPTION,
  },
}

export default async function BlogIndexPage() {
  const blogs = await getPublishedBlogs()

  return (
    <Main>
      <Section
        eyebrow="Blog"
        headline="Stories and playbooks for building faster"
        subheadline="Explore practical notes from building AI-native products with a production-ready starter foundation."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {blogs.map((blog) => {
            const coverImageUrl = resolveMediaUrl(blog.coverImage)
            const categoryName =
              typeof blog.category === 'object' ? blog.category.name : 'General'

            return (
              <article
                key={blog.id}
                className="overflow-hidden rounded-2xl border border-olive-950/10 bg-white dark:border-white/10 dark:bg-white/5"
              >
                {coverImageUrl ? (
                  <Image
                    src={coverImageUrl}
                    alt={blog.title}
                    width={1200}
                    height={630}
                    className="h-56 w-full object-cover"
                  />
                ) : null}

                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-olive-700 uppercase dark:text-olive-300">
                    <span>{categoryName}</span>
                    <span aria-hidden>-</span>
                    <span>{blog.readingTimeMinutes} min read</span>
                  </div>

                  <h2 className="text-xl font-semibold tracking-tight text-olive-950 dark:text-white">
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="hover:underline"
                    >
                      {blog.title}
                    </Link>
                  </h2>

                  {blog.excerpt ? (
                    <p className="text-sm/6 text-olive-700 dark:text-olive-300">
                      {blog.excerpt}
                    </p>
                  ) : null}

                  {blog.tags?.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <li
                          key={`${blog.id}-${tag.id ?? tag.tag}`}
                          className="rounded-full bg-olive-950/5 px-2.5 py-1 text-xs text-olive-700 dark:bg-white/10 dark:text-olive-300"
                        >
                          {tag.tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </Section>
    </Main>
  )
}
