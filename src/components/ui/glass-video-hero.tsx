import { type ReactNode } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

const DEFAULT_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4'

/** Unsplash abstract tech gradient — poster before video loads */
const DEFAULT_POSTER_URL =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=85&auto=format&fit=crop'

export type GlassVideoHeroProps = {
  videoUrl?: string
  posterUrl?: string
  title?: ReactNode
  description?: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  className?: string
}

export function HeroSection({
  videoUrl = DEFAULT_VIDEO_URL,
  posterUrl = DEFAULT_POSTER_URL,
  title = (
    <>
      Ship your SaaS
      <br className="hidden lg:block" />
      faster{' '}
      <em
        className="relative mx-[0.08em] inline-block italic"
        style={{ fontStyle: 'italic' }}
      >
        with
      </em>{' '}
      auth &amp; DB ready
    </>
  ),
  description = 'Production-ready Next.js template with Better Auth, Drizzle and PostgreSQL, TanStack Query, and tRPC—focus on your product, not plumbing.',
  primaryCta = { label: 'Get started', href: '/signup' },
  secondaryCta = { label: 'Sign in', href: '/login' },
  className,
}: GlassVideoHeroProps) {
  return (
    <section
      className={cn(
        'dark relative w-full overflow-hidden transition-all duration-500 ease-in-out',
        'py-32 lg:py-40',
        className,
      )}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterUrl}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      <div
        className="from-background/55 via-background/25 to-background/80 absolute inset-0 z-1 bg-linear-to-b"
        aria-hidden
      />

      <div className="relative z-10 mt-32 flex flex-col items-center px-6 text-center">
        <h1 className="font-instrument text-foreground mt-8 max-w-5xl text-5xl leading-[1.05] tracking-[-0.02em] lg:text-[96px]">
          {title}
        </h1>

        <p className="text-muted-foreground mt-6 max-w-[662px] font-sans text-lg font-normal">
          {description}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href={primaryCta.href}
            className="font-cabin bg-primary text-primary-foreground shadow-primary/25 rounded-[10px] px-8 py-3.5 text-base font-medium shadow-lg transition-all hover:brightness-110"
          >
            {primaryCta.label}
          </Link>
          <Link
            href={secondaryCta.href}
            className="font-cabin bg-secondary text-secondary-foreground rounded-[10px] px-8 py-3.5 text-base font-medium transition-all hover:brightness-125"
          >
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
