import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'
import { AnnouncementBadge } from '@/components/website/elements/announcement-badge'
import {
  ButtonLink,
  PlainButtonLink,
} from '@/components/website/elements/button'
import { InstallCommand } from '@/components/website/elements/install-command'
import { Link } from '@/components/website/elements/link'
import { Logo, LogoGrid } from '@/components/website/elements/logo-grid'
import { Main } from '@/components/website/elements/main'
import { Screenshot } from '@/components/website/elements/screenshot'
import { Section } from '@/components/website/elements/section'
import { Text } from '@/components/website/elements/text'
import { ArrowNarrowRightIcon } from '@/components/website/icons/arrow-narrow-right-icon'
import {
  Faq,
  FAQsTwoColumnAccordion,
} from '@/components/website/sections/faqs-two-column-accordion'
import {
  Feature,
  FeaturesTwoColumnWithDemos,
} from '@/components/website/sections/features-two-column-with-demos'
import { HeroLeftAlignedWithDemo } from '@/components/website/sections/hero-left-aligned-with-demo'
import {
  Testimonial,
  TestimonialThreeColumnGrid,
} from '@/components/website/sections/testimonials-three-column-grid'
import config from '@payload-config'
import type { Media } from '@/payload-types'

type HomepageData = {
  metadataTitle: string
  metadataDescription: string
  heroBadgeText: string
  heroBadgeCta: string
  heroBadgeHref: string
  heroHeadline: string
  heroDescription: string
  heroInstallSnippet: string
  heroPrimaryCtaLabel: string
  heroPrimaryCtaHref: string
  heroSecondaryCtaLabel: string
  heroSecondaryCtaHref: string
  heroMobileScreenshot?: number | Media | string
  heroMobileScreenshotAlt: string
  heroDesktopScreenshot?: number | Media | string
  heroDesktopScreenshotAlt: string
  commonProblems: Array<{ text: string }>
  solutionTitle: string
  solutionDescription: string
  starterFeatures: Array<{ title: string; description: string }>
  demoFeatures: Array<{
    headline: string
    subheadline: string
    imageSrc: number | Media | string
    imageAlt: string
    wallpaper: 'blue' | 'green' | 'purple' | 'brown'
    placement: 'bottom' | 'bottom-left' | 'bottom-right'
    ctaHref: string
    ctaLabel: string
  }>
  starterWorkflow: Array<{ step: string; title: string; description: string }>
}

type TestimonialItem = {
  quote: string
  name: string
  byline: string
  avatar: string
}

type LogoItem = {
  name: string
  width: number
  height: number
  image: number | Media
}

type FaqItem = {
  question: string
  answer: string
}

function resolveMediaUrl(
  media: number | Media | string | null | undefined,
  fallback = '',
) {
  if (typeof media === 'string') return media
  if (typeof media === 'object' && media?.url) return media.url
  return fallback
}

async function getHomepageContent() {
  const payload = await getPayload({ config })

  try {
    const [homepage, testimonialsResult, logosResult, faqsResult] =
      await Promise.all([
        payload.findGlobal({ slug: 'homepage' }),
        payload.find({
          collection: 'homepage-testimonials',
          sort: 'createdAt',
          limit: 10,
        }),
        payload.find({
          collection: 'logos',
          sort: 'createdAt',
          limit: 20,
          depth: 1,
        }),
        payload.find({
          collection: 'faqs',
          sort: 'createdAt',
          limit: 20,
        }),
      ])

    const homepageData = { ...homepage } as HomepageData
    const testimonials = testimonialsResult.docs.length
      ? (testimonialsResult.docs as unknown as TestimonialItem[])
      : []
    const logos = logosResult.docs.length
      ? (logosResult.docs as unknown as LogoItem[])
      : []
    const faqs = faqsResult.docs.length
      ? (faqsResult.docs as unknown as FaqItem[])
      : []

    return { homepage: homepageData, testimonials, logos, faqs }
  } catch (error) {
    throw error
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { homepage } = await getHomepageContent()

  return {
    title: homepage.metadataTitle,
    description: homepage.metadataDescription,
  }
}

export default async function Home() {
  const { homepage, testimonials, logos, faqs } = await getHomepageContent()

  return (
    <Main>
      <HeroLeftAlignedWithDemo
        id="hero"
        className="pt-20 sm:pt-28"
        eyebrow={
          <AnnouncementBadge
            href={homepage.heroBadgeHref}
            text={homepage.heroBadgeText}
            cta={homepage.heroBadgeCta}
          />
        }
        headline={homepage.heroHeadline}
        subheadline={
          <>
            <p>{homepage.heroDescription}</p>
            <div className="hidden self-start md:block">
              <InstallCommand
                snippet={homepage.heroInstallSnippet}
                variant="overlay"
              />
            </div>
          </>
        }
        cta={
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href={homepage.heroPrimaryCtaHref} size="lg">
              {homepage.heroPrimaryCtaLabel}
            </ButtonLink>
            <PlainButtonLink href={homepage.heroSecondaryCtaHref} size="lg">
              {homepage.heroSecondaryCtaLabel} <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
        }
        demo={
          <>
            <Screenshot
              className="rounded-md lg:hidden"
              wallpaper="green"
              placement="bottom-right"
            >
              <Image
                src={resolveMediaUrl(homepage.heroMobileScreenshot)}
                alt={homepage.heroMobileScreenshotAlt}
                width={1670}
                height={1408}
                className="bg-white/75"
              />
            </Screenshot>
            <Screenshot
              className="rounded-lg max-lg:hidden"
              wallpaper="green"
              placement="bottom"
            >
              <Image
                src={resolveMediaUrl(homepage.heroDesktopScreenshot)}
                alt={homepage.heroDesktopScreenshotAlt}
                width={3440}
                height={1990}
                className="bg-white/75 dark:bg-black/75"
              />
            </Screenshot>
          </>
        }
        footer={
          <LogoGrid>
            {logos.map((logo) => (
              <Logo key={logo.name}>
                <Image
                  src={resolveMediaUrl(logo.image)}
                  alt={logo.name}
                  width={logo.width}
                  height={logo.height}
                />
              </Logo>
            ))}
          </LogoGrid>
        }
      />

      <Section
        eyebrow="Problem and solution"
        headline="Stop rebuilding the same SaaS foundation every time"
        subheadline="This starter removes repetitive setup work so you can focus on your unique product logic."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5">
            <h3 className="tracking-tight text-olive-950 dark:text-white">
              The problem
            </h3>
            <ul className="mt-4 space-y-3 text-sm/7 text-olive-700 dark:text-olive-400">
              {homepage.commonProblems.map((problem) => (
                <li key={problem.text} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 text-olive-600 dark:text-olive-300"
                  >
                    -
                  </span>
                  <span>{problem.text}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5">
            <h3 className="tracking-tight text-olive-950 dark:text-white">
              The solution
            </h3>
            <Text className="mt-4">
              {homepage.solutionTitle} {homepage.solutionDescription}
            </Text>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/app">Start from this template</ButtonLink>
              <PlainButtonLink href="#demo">
                View template demos
              </PlainButtonLink>
            </div>
          </article>
        </div>
      </Section>

      <Section
        id="stack"
        eyebrow="Libraries and integrations included"
        headline="Everything you need to ship a microSaaS"
        subheadline="Start with a strong baseline and spend your time on product differentiation, not repetitive wiring."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homepage.starterFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5"
            >
              <h3 className="tracking-tight text-olive-950 dark:text-white">
                {feature.title}
              </h3>
              <Text className="mt-3">{feature.description}</Text>
            </article>
          ))}
        </div>
      </Section>

      <FeaturesTwoColumnWithDemos
        id="demo"
        eyebrow="Demo product workflows"
        headline="Preview core workflows before you write custom code"
        subheadline="Show prospects exactly how fast they can launch with this starter by demoing core workflows."
        features={
          <>
            {homepage.demoFeatures.map((feature) =>
              // Seed defaults use URL strings, while CMS data stores a media relation.
              // This handles both shapes safely.
              (() => {
                const resolvedImageSrc = resolveMediaUrl(feature.imageSrc)

                return (
                  <Feature
                    key={feature.headline}
                    demo={
                      <Screenshot
                        wallpaper={feature.wallpaper}
                        placement={feature.placement}
                      >
                        <Image
                          src={resolvedImageSrc}
                          alt={feature.imageAlt}
                          className="bg-white/75 dark:bg-black/75"
                          width={1800}
                          height={1250}
                        />
                      </Screenshot>
                    }
                    headline={feature.headline}
                    subheadline={<p>{feature.subheadline}</p>}
                    cta={
                      <Link href={feature.ctaHref}>
                        {feature.ctaLabel} <ArrowNarrowRightIcon />
                      </Link>
                    }
                  />
                )
              })(),
            )}
          </>
        }
      />

      <Section
        id="how-it-works"
        eyebrow="How it works"
        headline="A simple workflow from idea to launch"
        subheadline="Follow a repeatable process to move quickly without sacrificing quality."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {homepage.starterWorkflow.map((item) => (
            <article
              key={item.step}
              className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5"
            >
              <p className="font-mono text-xs tracking-[0.2em] text-olive-600 uppercase dark:text-olive-300">
                Step {item.step}
              </p>
              <h3 className="mt-3 tracking-tight text-olive-950 dark:text-white">
                {item.title}
              </h3>
              <Text className="mt-3">{item.description}</Text>
            </article>
          ))}
        </div>
      </Section>

      <TestimonialThreeColumnGrid
        eyebrow="Testimonials"
        headline="Teams shipping faster with this starter"
        subheadline="Founders and product teams use this template to launch sooner without rebuilding core SaaS infrastructure."
      >
        {testimonials.map((item) => (
          <Testimonial
            key={`${item.name}-${item.byline}`}
            quote={<p>{item.quote}</p>}
            img={
              <Image
                src={item.avatar}
                alt={`${item.name} profile photo`}
                width={96}
                height={96}
              />
            }
            name={item.name}
            byline={item.byline}
          />
        ))}
      </TestimonialThreeColumnGrid>

      <FAQsTwoColumnAccordion
        headline="Frequently asked questions"
        subheadline="Everything you need to know before launching your next microSaaS with this starter."
      >
        {faqs.map((faq) => (
          <Faq
            key={faq.question}
            question={faq.question}
            answer={<p>{faq.answer}</p>}
          />
        ))}
      </FAQsTwoColumnAccordion>

      <Section
        eyebrow="Built for rapid iteration"
        headline="From idea to launch, without rebuilding the basics"
        subheadline="Use this starter as your default foundation for new products and move from concept to paying customers faster."
      >
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/app" size="lg">
            Start building now
          </ButtonLink>
          <PlainButtonLink href="https://nextjs.org/docs" size="lg">
            Explore docs
          </PlainButtonLink>
        </div>
      </Section>
    </Main>
  )
}
