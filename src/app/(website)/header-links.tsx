import { NavbarLink } from '@/components/website/sections/navbar-with-links-actions-and-centered-logo'

export function HeaderLinks() {
  return (
    <>
      <NavbarLink href="/blog">Blog</NavbarLink>
      <NavbarLink href="/pricing">Pricing</NavbarLink>
      <NavbarLink href="/#stack">Features</NavbarLink>
      <NavbarLink href="/#demo">Demo</NavbarLink>
      <NavbarLink href="/#how-it-works">How it works</NavbarLink>
      <NavbarLink href="/app" className="sm:hidden">
        Log in
      </NavbarLink>
    </>
  )
}
