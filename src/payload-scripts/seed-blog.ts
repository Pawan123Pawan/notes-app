import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import { uploadMediaFromUrl } from './lib/upload-media-from-url'

async function createRichText(content: string) {
  return convertMarkdownToLexical({
    editorConfig: await editorConfigFactory.default({ config: await config }),
    markdown: content,
  })
}

const categoriesSeed = [
  {
    name: 'Build Faster',
    slug: 'build-faster',
    description:
      'Tactical posts for reducing setup time and getting to product iteration quickly.',
  },
  {
    name: 'AI Product Playbooks',
    slug: 'ai-product-playbooks',
    description:
      'Practical implementation guides for AI-first SaaS workflows and features.',
  },
]

const blogsSeed = [
  {
    title: 'How an AI-Native Starter Kit Removes Week-One Friction',
    slug: 'ai-native-starter-kit-removes-week-one-friction',
    excerpt:
      'Start from a production baseline so your team can ship product outcomes instead of boilerplate.',
    status: 'published' as const,
    categorySlug: 'build-faster',
    readingTimeMinutes: 6,
    tags: ['ai-native', 'starter-kit', 'shipping-speed', 'saas'],
    metaTitle: 'AI-Native Starter Kit: Ship Product Faster',
    metaDescription:
      'Learn how an AI-native SaaS starter kit helps teams move from setup to shipping in days.',
    metaKeywords: ['AI native starter kit', 'SaaS starter', 'build fast'],
    canonicalUrl:
      'https://microsaas-starter.dev/blog/ai-native-starter-kit-removes-week-one-friction',
    isPinned: true,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How an AI-Native Starter Kit Removes Week-One Friction',
      description:
        'Learn how an AI-native SaaS starter kit helps teams move from setup to shipping in days.',
      author: {
        '@type': 'Person',
        name: 'microSaaS starter team',
      },
    },
    coverImageUrl:
      'https://assets.tailwindplus.com/screenshots/1.webp?left=1670&top=1408',
    coverImageAlt: 'Team shipping quickly with AI-native starter toolkit',
    content: await createRichText(
      'Most teams lose momentum in the first week while wiring authentication, database models, API contracts, and admin tooling.\nAn AI-native starter kit compresses this setup work by shipping sensible defaults and integrated primitives across product, marketing, and operations.\nThis means your first iteration focuses on customer workflows and value delivery, not infrastructure churn.\nUse the starter as a baseline, then layer in your domain logic while preserving production guardrails and velocity.',
    ),
  },
  {
    title: 'From Idea to MVP: A 48-Hour AI-SaaS Launch Blueprint',
    slug: 'idea-to-mvp-48-hour-ai-saas-launch-blueprint',
    excerpt:
      'A practical launch sequence for teams that want to validate an AI product fast.',
    status: 'published' as const,
    categorySlug: 'ai-product-playbooks',
    readingTimeMinutes: 8,
    tags: ['mvp', 'ai-saas', 'launch', 'execution'],
    metaTitle: '48-Hour AI-SaaS MVP Launch Blueprint',
    metaDescription:
      'Follow this 48-hour execution flow to launch an AI-SaaS MVP using a starter kit foundation.',
    metaKeywords: ['AI MVP launch', 'SaaS blueprint', 'startup execution'],
    canonicalUrl:
      'https://microsaas-starter.dev/blog/idea-to-mvp-48-hour-ai-saas-launch-blueprint',
    isPinned: false,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'From Idea to MVP: A 48-Hour AI-SaaS Launch Blueprint',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Define a narrow customer problem',
        },
        {
          '@type': 'HowToStep',
          name: 'Implement one high-value AI workflow',
        },
        {
          '@type': 'HowToStep',
          name: 'Ship onboarding and collect early feedback',
        },
      ],
    },
    coverImageUrl:
      'https://assets.tailwindplus.com/screenshots/1.webp?right=1800&top=1250&color=olive',
    coverImageAlt: 'Product launch checklist for AI SaaS MVP',
    content: await createRichText(`
## Why 48 Hours?

Constraints are a forcing function. Give yourself two weeks and you'll spend three days picking a color palette. Give yourself 48 hours and you'll make decisions fast, cut scope mercilessly, and ship something real.

The goal isn't perfection. The goal is a working product in front of real users by Sunday night — something you can charge for, something that proves the idea deserves more of your time.

This blueprint is for developers who already know how to build. The bottleneck isn't skill. It's structure.

---

## Before the Clock Starts

The 48 hours are for building, not thinking. Answer these three questions before you begin:

**What is the one sentence value proposition?**
Not "an AI tool for marketers." Something like: *"Paste your support tickets, get a FAQ page in 30 seconds."* Specific. Measurable. Immediate.

**Who is the first user?**
Not a demographic. A person. Ideally someone you can message directly when it's live.

**What is the one core action that delivers value?**
Everything outside that action is out of scope for this weekend.

Write these down. Tape them to your monitor. Every scope decision this weekend gets measured against them.

---

## The Stack (Decide Once, Don't Revisit)

Choosing your stack inside the 48 hours is a trap. Pick a default stack before you start and commit to it. Here's a sensible default for an AI-SaaS MVP:

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js | Full-stack in one repo, deploy anywhere |
| Styling | Tailwind + shadcn/ui | Fast, consistent, no design decisions |
| Auth | Clerk or NextAuth | Auth in under an hour |
| Database | Supabase (Postgres) | Instant REST + realtime, generous free tier |
| AI | OpenAI or Anthropic SDK | Reliable, well-documented, pay-as-you-go |
| Payments | Stripe | The only serious option |
| Deployment | Vercel | Zero-config, instant previews |
| Email | Resend | Developer-first, simple API |

The starter kit scaffolds all of this for you. Your job this weekend is to build *the thing in the middle* — the feature that uses the AI to solve the problem. Everything else is already wired up.

---

## Hour-by-Hour Blueprint

### Day 1 — Build the Core (0–24 hrs)

**Hours 0–2: Project Setup**

Scaffold the starter kit, connect your environment variables, deploy a "hello world" to production. Yes, deploy immediately. You want a live URL from hour two — it creates momentum and catches environment issues early.

Checklist:
- Repo initialized and pushed
- Env vars configured (OpenAI key, Supabase URL, Stripe keys)
- Auth working (sign up, sign in, sign out)
- Deployed to Vercel with a real domain

**Hours 2–8: The Core Feature**

This is the only thing that matters today. Build the one action that delivers value. If your product summarizes documents, build the upload → summarize → display flow. Nothing else. No dashboard. No settings. No profile page.

Ship ugly. The AI output being correct matters infinitely more than the UI being beautiful.

**Hours 8–12: The Happy Path**

Walk through the product as a first-time user. Fix anything that is broken or confusing on the critical path. Not "nice to have" fixes — only things that would stop a user from experiencing the core value.

**Hours 12–16: Payments**

Wire up Stripe. You need at minimum:
- A single pricing page with one plan
- A checkout flow that works
- Gating the core feature behind a paid or trial status

Deciding to "add payments later" is how you build a free tool by accident. Do it now while the pressure is high.

**Hours 16–24: Sleep**

Non-negotiable. Your judgment degrades sharply after a long day of focused building. The code you write between midnight and 3am will cost you more time tomorrow than you saved tonight.

---

### Day 2 — Polish, Launch, and Distribute (24–48 hrs)

**Hours 24–28: The First-User Experience**

Assume your first user has never seen your product and has zero context. Walk through the entire flow cold. Specifically look for:

- Is it obvious what the product does within 5 seconds of landing?
- Is the first action the user should take self-evident?
- Is the output of the AI good enough that someone would tell a colleague about it?

Fix the blockers. Leave the nice-to-haves.

**Hours 28–32: Landing Page**

You don't need a ten-section marketing masterpiece. You need:

1. **Headline** — the one-sentence value proposition, verbatim
2. **Sub-headline** — who it's for and what they stop suffering from
3. **A short demo** — a GIF, a screenshot, or an embedded video of the core action
4. **One CTA** — "Try it free" or "Get started for $X/mo"
5. **Three short proof points** — not testimonials (you don't have them yet), just honest specifics about what the product does

That's it. Launch this.

**Hours 32–38: Distribution**

Building without distributing is a private project, not a product launch. Go where your first user lives and be honest about what you've built.

Good places to post, depending on your audience:
- **Hacker News** — "Show HN: I built X in 48 hours, here's what I learned"
- **Reddit** — subreddits specific to your problem domain, not general startup subs
- **Twitter / X** — build-in-public thread documenting the 48 hours
- **LinkedIn** — if your audience is professional/B2B
- **Indie Hackers** — receptive community, milestone posts get traction
- **Product Hunt** — schedule for a weekday morning launch if you want maximum exposure

The build-in-public angle is an asset here. Document what you built, the decisions you made, and what's rough. People root for honest builders.

**Hours 38–44: Talk to Users**

Message the first five people who sign up, personally. Not an automated email — a real message from you. Ask one question: *"What were you hoping this would help you with?"*

The answers will tell you whether you built the right thing and what to build next. This is more valuable than any analytics dashboard.

**Hours 44–48: Triage and Reflect**

Fix the one or two most critical bugs surfaced by real users. Anything that isn't a crash or a broken payment flow goes on a list for next week.

Then write a brief retrospective for yourself:
- What did you ship?
- What did you cut and why?
- What did the first users say?
- What's the one next thing that would make this meaningfully better?

---

## What You're Allowed to Cut

Scope creep is the enemy. Here's explicit permission to defer all of the following:

| Deferred | Why It's Fine |
|---|---|
| User dashboard / analytics | Users care about output, not metrics |
| Team / multi-user support | Build for one user first |
| Mobile optimization | Validate the idea on desktop first |
| Dark mode | Not a launch blocker |
| Onboarding flow | A well-written empty state is enough |
| Blog / content | Launch first, content second |
| Admin panel | Check Supabase directly for now |
| API access / webhooks | A product-market fit problem, not a launch problem |

---

## The Mindset That Makes This Work

**Ugly is fine. Broken is not.**
A rough UI with a working core feature is infinitely more launchable than a beautiful shell with nothing behind it.

**You are not launching a company. You are running an experiment.**
The experiment has one hypothesis: *"People want this enough to pay for it."* Everything this weekend is in service of testing that hypothesis, not proving it right.

**The first version should embarrass you slightly.**
If you're not embarrassed by what you launch, you waited too long. The goal is to learn, and you can only learn from something real users touch.

**Done is a competitive advantage.**
Most people with the same idea will still be "working on it" in six months. You shipped in a weekend. That means you'll have six months of real user feedback while they're still debating their tech stack.

---

## After the 48 Hours

You should now have:
- A live product with a real URL
- At least one working payment method
- At least a handful of users who tried it
- Direct feedback from real people

From here, the path is simple even if it isn't easy: talk to users, improve the thing that most blocks conversion, repeat. The hard part — proving the idea deserves to exist — is behind you.

The rest is iteration.

---

*Built with the [Your Starter Kit Name] microsaas starter kit — auth, payments, AI, and database wired up so you can spend your 48 hours building the thing that matters.*
      `),
  },
]

async function seedBlog() {
  const payload = await getPayload({ config })

  const existingCategories = await payload.find({
    collection: 'blog-categories',
    limit: 100,
  })

  await Promise.all(
    existingCategories.docs.map((doc) =>
      payload.delete({
        collection: 'blog-categories',
        id: doc.id,
      }),
    ),
  )

  const createdCategories = await Promise.all(
    categoriesSeed.map((category) =>
      payload.create({
        collection: 'blog-categories',
        data: category,
      }),
    ),
  )

  const categoryIdBySlug = new Map(
    createdCategories.map((category) => [category.slug, category.id]),
  )

  const existingBlogs = await payload.find({
    collection: 'blogs',
    limit: 200,
  })

  await Promise.all(
    existingBlogs.docs.map((doc) =>
      payload.delete({
        collection: 'blogs',
        id: doc.id,
      }),
    ),
  )

  let authorId: number | string | undefined
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
  })
  const firstUser = existingUsers.docs[0]

  if (firstUser) {
    authorId = firstUser.id
  } else {
    const createdUser = await payload.create({
      collection: 'users',
      data: {
        email: 'blog-author@microsaas-starter.dev',
        password: 'ChangeMe123!',
      },
    })
    authorId = createdUser.id
  }

  for (const blog of blogsSeed) {
    const categoryId = categoryIdBySlug.get(blog.categorySlug)

    if (!categoryId || !authorId) {
      throw new Error(
        `Unable to resolve category or author for "${blog.title}"`,
      )
    }

    const coverImage = await uploadMediaFromUrl(payload, {
      url: blog.coverImageUrl,
      alt: blog.coverImageAlt,
      fileNamePrefix: blog.title,
    })

    await payload.create({
      collection: 'blogs',
      data: {
        coverImage,
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        author: authorId,
        status: blog.status,
        category: categoryId,
        tags: blog.tags.map((tag) => ({ tag })),
        readingTimeMinutes: blog.readingTimeMinutes,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        metaKeywords: blog.metaKeywords.map((keyword) => ({ keyword })),
        canonicalUrl: blog.canonicalUrl,
        isPinned: blog.isPinned,
        structuredData: blog.structuredData,
      },
    })
  }

  payload.logger.info('Blog and blog category seed completed.')
}

seedBlog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
