import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { uploadMediaFromUrl } from './lib/upload-media-from-url'

const homepageGlobalSeed = {
  metadataTitle: 'Micro SaaS Starter',
  metadataDescription:
    'Next.js starter with Better Auth, Drizzle and PostgreSQL, TanStack Query, and tRPC.',
  navbarBrand: 'microSaaS starter',
  heroBadgeText: 'Launch your SaaS foundation in minutes',
  heroBadgeCta: 'Open starter app',
  heroBadgeHref: '/app',
  heroHeadline:
    'Build your microSaaS pages faster with a production-ready starter.',
  heroDescription:
    'Skip setup fatigue and ship features sooner. This template already includes auth, APIs, database, CMS, email, and a polished UI system so you can focus on your product.',
  heroInstallSnippet:
    'git clone https://github.com/abinashpanda/microsaas-starter.git',
  heroPrimaryCtaLabel: 'Open Dashboard',
  heroPrimaryCtaHref: '/app',
  heroSecondaryCtaLabel: 'See how it works',
  heroSecondaryCtaHref: '#demo',
  heroMobileScreenshotUrl:
    'https://assets.tailwindplus.com/screenshots/1.webp?left=1670&top=1408',
  heroMobileScreenshotAlt: 'Starter product workflow preview',
  heroDesktopScreenshotUrl:
    'https://assets.tailwindplus.com/screenshots/1.webp',
  heroDesktopScreenshotAlt: 'Starter dashboard full preview',
  commonProblems: [
    {
      text: 'Rebuilding auth, billing, and data foundations for every new idea.',
    },
    {
      text: 'Losing momentum while wiring API types, database migrations, and admin tooling.',
    },
    {
      text: 'Delayed launches because marketing pages and product UI are not production ready.',
    },
  ],
  solutionTitle:
    'Use a production-grade template with auth, database, APIs, CMS, email, and UI primitives already integrated.',
  solutionDescription:
    'Instead of stitching core infrastructure together, you can spend your time validating features, improving onboarding, and reaching revenue faster.',
  starterFeatures: [
    {
      title: 'Authentication out of the box',
      description:
        'Better Auth is prewired with Drizzle so sign-up, sessions, and account flows are ready to ship.',
    },
    {
      title: 'Typed APIs end to end',
      description:
        'tRPC and TanStack Query are configured so your client and server stay type-safe without manual sync.',
    },
    {
      title: 'Database and migrations ready',
      description:
        'Drizzle ORM with PostgreSQL and scripts for generating and running migrations are already in place.',
    },
    {
      title: 'Workspace management ready',
      description:
        'Start with collaborative workspace patterns out of the box, including app structure that supports teams, shared context, and scoped product flows.',
    },
    {
      title: 'Built-in theming support',
      description:
        'Light and dark mode styling is already wired into the UI system so you can ship a consistent branded experience faster.',
    },
    {
      title: 'UI foundation included',
      description:
        'Tailwind CSS v4, Tailwind Plus elements, and shadcn/ui-compatible setup help you build polished pages fast.',
    },
  ],
  demoFeatures: [
    {
      headline: 'Shared Workspace',
      subheadline:
        'Keep customer messages, assignment workflows, and team context in one collaborative surface designed for speed.',
      imageSrc:
        'https://assets.tailwindplus.com/screenshots/1.webp?left=1800&top=1250&color=olive',
      imageAlt: 'Shared inbox demo in the starter app',
      wallpaper: 'purple' as const,
      placement: 'bottom-right' as const,
      ctaHref: '/app',
      ctaLabel: 'See how it works',
    },
    {
      headline: 'AI-Powered Assistant',
      subheadline:
        'Turn long support threads into actionable summaries, suggested replies, and faster resolution without context switching.',
      imageSrc:
        'https://assets.tailwindplus.com/screenshots/1.webp?right=1800&top=1250&color=olive',
      imageAlt: 'AI assistant demo in the starter app',
      wallpaper: 'blue' as const,
      placement: 'bottom-left' as const,
      ctaHref: '/app',
      ctaLabel: 'See how it works',
    },
  ],
  starterWorkflow: [
    {
      step: '01',
      title: 'Install and run',
      description:
        'Clone the starter, install dependencies, and run the app with the included scripts.',
    },
    {
      step: '02',
      title: 'Configure your product',
      description:
        'Set env variables, connect PostgreSQL, and adjust auth/content setup for your use case.',
    },
    {
      step: '03',
      title: 'Build and launch features',
      description:
        'Ship product pages and app features on top of an already integrated SaaS foundation.',
    },
  ],
  footerFineprint:
    'microSaaS starter. Ship faster with a production-ready foundation.',
  footerPrimaryCtaLabel: 'Launch your app',
  footerPrimaryCtaHref: '/app',
}

const homepageTestimonialsSeed = [
  {
    quote:
      'We went from idea to first paying customer in under two weeks. The auth, API, and data foundation saved us days of setup.',
    name: 'Aarav Patel',
    byline: 'Founder, LaunchPilot',
    avatar: 'https://assets.tailwindplus.com/avatars/11.webp?size=160',
  },
  {
    quote:
      'The built-in workspace patterns and theming support helped our team ship a polished multi-tenant app with much less custom groundwork.',
    name: 'Maya Chen',
    byline: 'Product Engineer, TeamCanvas',
    avatar: 'https://assets.tailwindplus.com/avatars/11.webp?size=160',
  },
  {
    quote:
      'We replaced a month of boilerplate with one weekend of customization. Everything important was already structured and production-friendly.',
    name: 'Noah Williams',
    byline: 'Indie Hacker, MetricFlow',
    avatar: 'https://assets.tailwindplus.com/avatars/11.webp?size=160',
  },
]

const homepageLogosSeed = [
  {
    name: 'Customer logo 1',
    imageUrl:
      'https://assets.tailwindplus.com/logos/9.svg?color=white&height=32',
    width: 51,
    height: 32,
  },
  {
    name: 'Customer logo 2',
    imageUrl:
      'https://assets.tailwindplus.com/logos/10.svg?color=white&height=32',
    width: 70,
    height: 32,
  },
  {
    name: 'Customer logo 3',
    imageUrl:
      'https://assets.tailwindplus.com/logos/11.svg?color=white&height=32',
    width: 100,
    height: 32,
  },
  {
    name: 'Customer logo 4',
    imageUrl:
      'https://assets.tailwindplus.com/logos/12.svg?color=white&height=32',
    width: 85,
    height: 32,
  },
  {
    name: 'Customer logo 5',
    imageUrl:
      'https://assets.tailwindplus.com/logos/13.svg?color=white&height=32',
    width: 75,
    height: 32,
  },
  {
    name: 'Customer logo 6',
    imageUrl:
      'https://assets.tailwindplus.com/logos/8.svg?color=white&height=32',
    width: 85,
    height: 32,
  },
]

async function uploadHomepageDemoMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  const mappedDemoFeatures = await Promise.all(
    homepageGlobalSeed.demoFeatures.map(async (feature) => {
      const mediaId = await uploadMediaFromUrl(payload, {
        url: feature.imageSrc,
        alt: feature.imageAlt,
        fileNamePrefix: feature.headline,
      })

      return {
        ...feature,
        imageSrc: mediaId,
      }
    }),
  )

  return mappedDemoFeatures
}

async function seedHomepage() {
  const payload = await getPayload({ config })
  const demoFeatures = await uploadHomepageDemoMedia(payload)
  const heroMobileScreenshot = await uploadMediaFromUrl(payload, {
    url: homepageGlobalSeed.heroMobileScreenshotUrl,
    alt: homepageGlobalSeed.heroMobileScreenshotAlt,
    fileNamePrefix: 'hero-mobile-screenshot',
  })
  const heroDesktopScreenshot = await uploadMediaFromUrl(payload, {
    url: homepageGlobalSeed.heroDesktopScreenshotUrl,
    alt: homepageGlobalSeed.heroDesktopScreenshotAlt,
    fileNamePrefix: 'hero-desktop-screenshot',
  })
  const homepageData = Object.fromEntries(
    Object.entries(homepageGlobalSeed).filter(
      ([key]) =>
        key !== 'heroMobileScreenshotUrl' && key !== 'heroDesktopScreenshotUrl',
    ),
  )

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      ...homepageData,
      demoFeatures,
      heroMobileScreenshot,
      heroDesktopScreenshot,
    },
  })

  const existing = await payload.find({
    collection: 'homepage-testimonials',
    limit: 100,
  })

  await Promise.all(
    existing.docs.map((doc) =>
      payload.delete({
        collection: 'homepage-testimonials',
        id: doc.id,
      }),
    ),
  )

  await Promise.all(
    homepageTestimonialsSeed.map((testimonial) =>
      payload.create({
        collection: 'homepage-testimonials',
        data: testimonial,
      }),
    ),
  )

  const existingLogos = await payload.find({
    collection: 'logos',
    limit: 200,
  })

  await Promise.all(
    existingLogos.docs.map((doc) =>
      payload.delete({
        collection: 'logos',
        id: doc.id,
      }),
    ),
  )

  for (const logo of homepageLogosSeed) {
    const image = await uploadMediaFromUrl(payload, {
      url: logo.imageUrl,
      alt: logo.name,
      fileNamePrefix: logo.name,
    })

    await payload.create({
      collection: 'logos',
      data: {
        name: logo.name,
        image,
        width: logo.width,
        height: logo.height,
      },
    })
  }

  payload.logger.info('Homepage and logos seed completed.')
}

seedHomepage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
