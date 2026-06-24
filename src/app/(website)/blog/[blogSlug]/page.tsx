import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Blog, Media } from '@/payload-types'
import { Main } from '@/components/website/elements/main'
import { Section } from '@/components/website/elements/section'
import { Heading } from '@/components/website/elements/heading'
import { env } from '@/lib/env'
import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import { Text } from '@/components/website/elements/text'
import { Screenshot } from '@/components/website/elements/screenshot'

type BlogPageProps = {
  params: Promise<{
    blogSlug: string
  }>
}

function resolveMediaUrl(media: number | Media | string | null | undefined) {
  if (typeof media === 'string') return media
  if (typeof media === 'object' && media?.url) return media.url
  return ''
}

async function getBlogBySlug(slug: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'blogs',
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
    depth: 2,
    limit: 1,
  })

  return (result.docs[0] as Blog | undefined) ?? null
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { blogSlug } = await params
  const blog = await getBlogBySlug(blogSlug)

  if (!blog) {
    return {
      title: `Blog post not found | ${env.APP_NAME}`,
      description: 'The requested blog post could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const categoryName =
    typeof blog.category === 'object' ? blog.category.name : 'Blog'
  const keywords = blog.metaKeywords?.map((keyword) => keyword.keyword) ?? []
  const canonicalPath = `/blog/${blog.slug}`
  const canonicalUrl =
    blog.canonicalUrl || `${env.NEXT_PUBLIC_APP_URL}${canonicalPath}`
  const coverImageUrl = resolveMediaUrl(blog.coverImage)
  const description =
    blog.metaDescription || blog.excerpt || 'Read this article on our blog.'
  const title = blog.metaTitle || blog.title

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      tags: blog.tags?.map((tag) => tag.tag) ?? [],
      section: categoryName,
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      images: coverImageUrl
        ? [
            {
              url: coverImageUrl,
              alt: blog.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: coverImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: coverImageUrl ? [coverImageUrl] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { blogSlug } = await params
  const blog = await getBlogBySlug(blogSlug)

  if (!blog) {
    notFound()
  }

  const coverImageUrl = resolveMediaUrl(blog.coverImage)
  const categoryName =
    typeof blog.category === 'object' ? blog.category.name : 'General'
  const authorName =
    typeof blog.author === 'object' ? blog.author.email : 'Editorial Team'
  const hasStructuredData =
    typeof blog.structuredData === 'object' && blog.structuredData !== null

  return (
    <Main>
      {hasStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(blog.structuredData),
          }}
        />
      ) : null}

      <Section>
        <article className="mx-auto space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 font-mono text-sm font-medium tracking-wide text-olive-700 uppercase dark:text-olive-300">
              <span>{categoryName}</span>
              <span aria-hidden>-</span>
              <span>{blog.readingTimeMinutes} min read</span>
              <span aria-hidden>-</span>
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>

            <Heading>{blog.title}</Heading>

            {blog.excerpt ? <Text size="lg">{blog.excerpt}</Text> : null}

            <Text size="md">By {authorName}</Text>
          </header>

          {coverImageUrl ? (
            <Screenshot
              wallpaper="green"
              placement="bottom"
              className="rounded-lg"
            >
              <Image
                src={coverImageUrl}
                alt={blog.title}
                width={1400}
                height={900}
                className="w-full rounded-2xl border border-olive-950/10 object-cover dark:border-white/10"
              />
            </Screenshot>
          ) : null}

          <RichTextConverter
            data={blog.content}
            className="prose prose-olive dark:prose-olive-dark max-w-full"
          />

          {blog.tags?.length ? (
            <ul className="flex flex-wrap gap-2 border-t border-olive-950/10 pt-6 dark:border-white/10">
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
        </article>
      </Section>
    </Main>
  )
}
