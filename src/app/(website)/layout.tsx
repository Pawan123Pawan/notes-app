import { Instrument_Serif, Geist, Geist_Mono } from 'next/font/google'
import './website.css'
import { cn } from '@/lib/utils'
import { env } from '@/lib/env'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'
import { Button, PlainButtonLink } from '@/components/website/elements/button'
import {
  FooterCategory,
  FooterLink,
  FooterLinkButton,
  FooterWithLinkCategories,
} from '@/components/website/sections/footer-with-link-categories'
import {
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/website/sections/navbar-with-links-actions-and-centered-logo'
import { HeaderLinks } from './header-links'
import { JoinWaitlistDialog } from './join-waitlist-dialog'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})

const geist = Geist({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={cn(
        instrumentSerif.variable,
        geist.variable,
        geistMono.variable,
        'font-sans',
      )}
    >
      <body>
        <Toaster />
        <QueryProvider>
          <NavbarWithLinksActionsAndCenteredLogo
            id="navbar"
            links={<HeaderLinks />}
            logo={
              <NavbarLogo href="/">
                <span className="inline-flex items-center text-sm/7 font-semibold tracking-tight text-olive-950 dark:text-white">
                  {env.APP_NAME}
                </span>
              </NavbarLogo>
            }
            actions={
              <>
                <PlainButtonLink href="/login" className="max-sm:hidden">
                  Log in
                </PlainButtonLink>
                <JoinWaitlistDialog
                  trigger={<Button size="md">Join waitlist</Button>}
                />
              </>
            }
          />

          {children}

          <FooterWithLinkCategories
            links={
              <>
                <FooterCategory title="Product">
                  <FooterLink href="/#stack">Features</FooterLink>
                  <FooterLink href="/#demo">Demo</FooterLink>
                  <FooterLink href="/#how-it-works">How it works</FooterLink>
                </FooterCategory>
                <FooterCategory title="Starter">
                  <FooterLink href="/app">Dashboard</FooterLink>
                  <FooterLink href="/app">Log in</FooterLink>
                  <FooterLink href="/app">Get started</FooterLink>
                  <JoinWaitlistDialog
                    trigger={<FooterLinkButton>Join waitlist</FooterLinkButton>}
                  />
                </FooterCategory>
                <FooterCategory title="Resources">
                  <FooterLink href="https://nextjs.org/docs">
                    Next.js docs
                  </FooterLink>
                  <FooterLink href="https://trpc.io/docs">tRPC docs</FooterLink>
                  <FooterLink href="https://orm.drizzle.team/docs/overview">
                    Drizzle docs
                  </FooterLink>
                </FooterCategory>
              </>
            }
            fineprint={`${env.APP_NAME}. Build faster with production-ready SaaS foundations.`}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
