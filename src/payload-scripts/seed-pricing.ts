import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const pricingGlobalSeed = {
  metadataTitle: 'Pricing | microSaaS starter',
  metadataDescription:
    'Choose a microSaaS starter plan based on your launch stage, team size, and customization needs.',
  navbarBrand: 'microSaaS starter',
  heroHeadline: 'Simple pricing for founders shipping fast',
  heroSubheadline:
    'Start with the essentials, upgrade when your product grows, and keep all the core SaaS plumbing production-ready from day one.',
  plans: [
    {
      name: 'Starter',
      monthlyPrice: '$19',
      yearlyPrice: '$190',
      periodLabel: '/month',
      subheadline:
        'For solo builders validating an idea and shipping an MVP quickly.',
      features: [
        { text: '1 workspace included' },
        { text: 'Auth and onboarding flows' },
        { text: 'tRPC + TanStack Query setup' },
        { text: 'Landing page section library' },
        { text: 'Community support' },
      ],
      ctaLabel: 'Start with Starter',
      ctaHref: '/app',
      ctaVariant: 'soft' as const,
    },
    {
      name: 'Growth',
      badge: 'Most popular',
      monthlyPrice: '$79',
      yearlyPrice: '$790',
      periodLabel: '/month',
      subheadline:
        'For teams growing a validated product and shipping weekly updates.',
      features: [
        { text: 'Everything in Starter' },
        { text: 'Unlimited workspaces' },
        { text: 'Role-ready workspace patterns' },
        { text: 'Email + CMS configuration examples' },
        { text: 'Priority support and migration help' },
      ],
      ctaLabel: 'Choose Growth',
      ctaHref: '/app',
      ctaVariant: 'primary' as const,
    },
    {
      name: 'Scale',
      monthlyPrice: '$199',
      yearlyPrice: '$1990',
      periodLabel: '/month',
      subheadline:
        'For agencies and product studios launching multiple SaaS products.',
      features: [
        { text: 'Everything in Growth' },
        { text: 'Multi-project launch guidance' },
        { text: 'Architecture review checklist' },
        { text: 'Priority issue triage' },
        { text: 'Quarterly strategy call' },
      ],
      ctaLabel: 'Talk to sales',
      ctaHref: '#call-to-action',
      ctaVariant: 'soft' as const,
    },
  ],
  comparisonSections: [
    {
      title: 'Core foundation',
      features: [
        {
          name: 'Authentication setup',
          starterIncluded: true,
          growthIncluded: true,
          proIncluded: true,
        },
        {
          name: 'Typed API scaffolding',
          starterIncluded: true,
          growthIncluded: true,
          proIncluded: true,
        },
        {
          name: 'Workspace support',
          starterValue: '1 workspace',
          growthValue: 'Unlimited',
          proValue: 'Unlimited',
          growthIncluded: true,
          proIncluded: true,
        },
      ],
    },
    {
      title: 'Delivery speed',
      features: [
        {
          name: 'Reusable website sections',
          starterIncluded: true,
          growthIncluded: true,
          proIncluded: true,
        },
        {
          name: 'CMS seeding scripts',
          starterValue: 'Basic',
          growthValue: 'Advanced',
          proValue: 'Advanced',
          growthIncluded: true,
          proIncluded: true,
        },
        {
          name: 'Launch playbook',
          starterIncluded: false,
          growthIncluded: true,
          proIncluded: true,
        },
      ],
    },
    {
      title: 'Support',
      features: [
        {
          name: 'Email support',
          starterIncluded: true,
          growthIncluded: true,
          proIncluded: true,
        },
        {
          name: 'Priority turnaround',
          starterIncluded: false,
          growthIncluded: true,
          proIncluded: true,
        },
        {
          name: 'Dedicated technical advisor',
          starterIncluded: false,
          growthIncluded: false,
          proIncluded: true,
        },
      ],
    },
  ],
  testimonialQuote:
    'We launched our B2B microSaaS in less than three weeks. The starter gave us a stable base for auth, data, and marketing pages so we could focus on customer problems instead of setup.',
  testimonialName: 'Riya Menon',
  testimonialByline: 'Founder at SprintBoard',
  testimonialImageUrl:
    'https://assets.tailwindplus.com/avatars/16.webp?w=1400&h=1000',
  testimonialImageAlt: 'Founder portrait for testimonial section',
  faqs: [
    {
      question: 'Is this a one-time template or a hosted product?',
      answer:
        'This is a starter foundation you own and deploy yourself. You can customize code, UI, and product logic without platform lock-in.',
    },
    {
      question: 'Can I use this for client projects?',
      answer:
        'Yes. The Growth and Scale plans are designed for teams building multiple apps or client-facing products on top of the same proven architecture.',
    },
    {
      question: 'Do the plans include deployment costs?',
      answer:
        'No. Hosting and third-party service costs are separate and depend on your own infrastructure and usage.',
    },
    {
      question: 'Can I upgrade later as we grow?',
      answer:
        'Absolutely. Start with Starter for validation, then move to Growth or Scale when your team and launch velocity increase.',
    },
  ],
  ctaHeadline: 'Need help choosing the right plan?',
  ctaSubheadline:
    'Tell us what you are building and we will recommend the best starting point for your team, timeline, and budget.',
  ctaPrimaryLabel: 'Chat with us',
  ctaPrimaryHref: '/app',
  ctaSecondaryLabel: 'Book a walkthrough',
  ctaSecondaryHref: '/app',
  newsletterHeadline: 'Get launch-ready SaaS updates',
  newsletterSubheadline:
    'Receive practical product, architecture, and go-to-market notes built for microSaaS teams.',
  newsletterAction: '#',
  footerCategories: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#stack' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Demo', href: '/#demo' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/' },
        { label: 'Roadmap', href: '/#how-it-works' },
        { label: 'Contact', href: '/app' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Next.js Docs', href: 'https://nextjs.org/docs' },
        { label: 'tRPC Docs', href: 'https://trpc.io/docs' },
        {
          label: 'Drizzle Docs',
          href: 'https://orm.drizzle.team/docs/overview',
        },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/' },
        { label: 'Terms', href: '/' },
      ],
    },
  ],
  footerFineprint:
    'microSaaS starter - a practical foundation for shipping SaaS.',
  xUrl: 'https://x.com',
  githubUrl: 'https://github.com',
  youtubeUrl: 'https://www.youtube.com',
}

async function seedPricing() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'pricing',
    data: pricingGlobalSeed,
  })

  payload.logger.info('Pricing global seed completed.')
}

seedPricing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
