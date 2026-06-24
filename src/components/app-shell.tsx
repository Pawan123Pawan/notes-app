'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  CommandIcon,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { HotkeysProvider, useHotkeys } from 'react-hotkeys-hook'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import {
  type AppearanceAccentColor,
  type AppearanceBaseColor,
  type AppearanceTheme,
} from '@/lib/appearance'
import { ResolvedAppearanceProvider } from '@/hooks/resolved-appearance-context'
import { useAppearance } from '@/hooks/use-appearance'
import { useSyncResolvedAppearance } from '@/components/use-app-shell-sync'
import { useTRPC } from '@/trpc/client'

const ROUTE_PROGRESS_START_EVENT = 'app-route-progress-start'

function triggerRouteProgressStart() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(ROUTE_PROGRESS_START_EVENT))
}

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ 'aria-hidden'?: boolean }>
}

const navItems = [
  {
    href: '/app',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/app/settings',
    label: 'Settings',
    icon: Settings,
  },
] satisfies NavItem[]

function getNavMatchScore(pathname: string, href: string): number {
  if (pathname === href) {
    return href.length + 1000
  }

  if (href !== '/app' && pathname.startsWith(`${href}/`)) {
    return href.length
  }

  return -1
}

function AppCommandPalette({
  open,
  onOpenChange,
  onSignOut,
  onThemeChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignOut: () => Promise<void>
  onThemeChange: (theme: AppearanceTheme) => void
}) {
  const router = useRouter()

  const goToSettings = () => {
    triggerRouteProgressStart()
    router.push('/app/settings')
    onOpenChange(false)
  }

  const goToAppearanceSettings = () => {
    triggerRouteProgressStart()
    router.push('/app/settings?tab=appearance')
    onOpenChange(false)
  }

  const setAndCloseTheme = (theme: AppearanceTheme) => {
    onThemeChange(theme)
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      description="Search for app commands and run actions."
    >
      <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Account">
            <CommandItem onSelect={goToSettings}>
              <Settings className="size-4 opacity-70" />
              Go to settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                onOpenChange(false)
                void onSignOut()
              }}
            >
              <LogOut className="size-4 opacity-70" />
              Sign out
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Appearance">
            <CommandItem
              onSelect={() => {
                setAndCloseTheme('light')
              }}
            >
              <Sun className="size-4 opacity-70" />
              Light theme
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setAndCloseTheme('dark')
              }}
            >
              <Moon className="size-4 opacity-70" />
              Dark theme
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setAndCloseTheme('system')
              }}
            >
              <Monitor className="size-4 opacity-70" />
              System theme
            </CommandItem>
            <CommandItem onSelect={goToAppearanceSettings}>
              <Settings className="size-4 opacity-70" />
              Change app theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

function UserMenu({
  currentTheme,
  onThemeChange,
}: {
  currentTheme: AppearanceTheme
  onThemeChange: (theme: AppearanceTheme) => void
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  async function onSignOut() {
    await authClient.signOut()
    triggerRouteProgressStart()
    router.push('/login')
    router.refresh()
  }

  const label = session?.user.name?.trim() || session?.user.email || 'Account'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          className="h-10 w-full justify-between gap-2 px-2"
          type="button"
          variant="outline"
          aria-busy={isPending}
          aria-label="User menu"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <User className="size-4 shrink-0 opacity-70" />
            <span className="truncate text-left text-sm">
              {isPending ? '…' : label}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="bg-popover text-popover-foreground border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50 min-w-48 overflow-hidden rounded-lg border p-1 shadow-md"
          side="right"
          sideOffset={8}
        >
          <DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Signed in
          </DropdownMenu.Label>
          {session?.user.email ? (
            <div className="text-foreground px-2 pb-2 text-sm">
              {session.user.email}
            </div>
          ) : null}
          <DropdownMenu.Separator className="bg-border -mx-1 my-1 h-px" />
          <DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Theme
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={currentTheme}
            onValueChange={(value) => {
              onThemeChange(value as AppearanceTheme)
            }}
          >
            <DropdownMenu.RadioItem
              className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
              value="light"
            >
              <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenu.ItemIndicator>
                  <span className="bg-foreground size-2 rounded-full" />
                </DropdownMenu.ItemIndicator>
              </span>
              <span className="flex items-center gap-2">
                <Sun className="size-4 opacity-70" />
                Light
              </span>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem
              className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
              value="dark"
            >
              <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenu.ItemIndicator>
                  <span className="bg-foreground size-2 rounded-full" />
                </DropdownMenu.ItemIndicator>
              </span>
              <span className="flex items-center gap-2">
                <Moon className="size-4 opacity-70" />
                Dark
              </span>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem
              className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
              value="system"
            >
              <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenu.ItemIndicator>
                  <span className="bg-foreground size-2 rounded-full" />
                </DropdownMenu.ItemIndicator>
              </span>
              <span className="flex items-center gap-2">
                <Monitor className="size-4 opacity-70" />
                System
              </span>
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="bg-border -mx-1 my-1 h-px" />
          <DropdownMenu.Item
            className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
            onSelect={(e) => {
              e.preventDefault()
              void onSignOut()
            }}
          >
            <LogOut className="size-4 opacity-70" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function RouteTransitionProgress({
  pathname,
  searchParamsString,
}: {
  pathname: string
  searchParamsString: string
}) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const intervalRef = React.useRef<number | null>(null)
  const completeTimeoutRef = React.useRef<number | null>(null)

  const clearTimers = React.useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (completeTimeoutRef.current !== null) {
      window.clearTimeout(completeTimeoutRef.current)
      completeTimeoutRef.current = null
    }
  }, [])

  const startProgress = React.useCallback(() => {
    clearTimers()
    setIsVisible(true)
    setProgress(12)
    intervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        const increment = Math.max(1.5, (90 - current) * 0.08)
        return Math.min(90, current + increment)
      })
    }, 120)
  }, [clearTimers])

  const completeProgress = React.useCallback(() => {
    clearTimers()
    setProgress(100)
    completeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
      setProgress(0)
    }, 220)
  }, [clearTimers])

  React.useEffect(() => {
    const onProgressStart = () => {
      startProgress()
    }

    window.addEventListener(ROUTE_PROGRESS_START_EVENT, onProgressStart)
    return () => {
      window.removeEventListener(ROUTE_PROGRESS_START_EVENT, onProgressStart)
    }
  }, [startProgress])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      completeProgress()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [completeProgress, pathname, searchParamsString])

  React.useEffect(
    () => () => {
      clearTimers()
    },
    [clearTimers],
  )

  if (!isVisible) {
    return null
  }

  return (
    <div
      aria-hidden
      className="bg-primary pointer-events-none fixed top-0 left-0 z-[100] h-0.5 transition-[width,opacity] duration-200 ease-out"
      style={{ opacity: isVisible ? 1 : 0, width: `${progress}%` }}
    />
  )
}

/**
 * AppShell component that wraps the application and provides the sidebar and header.
 */
export function AppShell({
  children,
  initialAppearance,
}: React.PropsWithChildren<{
  initialAppearance: {
    theme: AppearanceTheme
    baseColor: AppearanceBaseColor
    accentColor: AppearanceAccentColor
  }
}>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchParamsString = searchParams.toString()
  const trpc = useTRPC()
  const appearanceQuery = useQuery(trpc.settings.getAppearance.queryOptions())
  const resolvedAppearance = React.useMemo(
    () => appearanceQuery.data ?? initialAppearance,
    [appearanceQuery.data, initialAppearance],
  )
  const appearance = useAppearance({
    currentAppearance: resolvedAppearance,
  })
  useSyncResolvedAppearance(appearance, resolvedAppearance)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false)

  const activeNavHref = React.useMemo(() => {
    let bestHref: string | null = null
    let bestScore = -1

    for (const item of navItems) {
      const score = getNavMatchScore(pathname, item.href)
      if (score > bestScore) {
        bestScore = score
        bestHref = item.href
      }
    }

    return bestHref
  }, [pathname])

  const onSignOut = React.useCallback(async () => {
    await authClient.signOut()
    triggerRouteProgressStart()
    router.push('/login')
    router.refresh()
  }, [router])

  const onThemeChange = React.useCallback(
    (nextTheme: AppearanceTheme) => {
      appearance.updateTheme(nextTheme)
    },
    [appearance],
  )

  useHotkeys(
    'meta+k, ctrl+k',
    (event) => {
      event.preventDefault()
      setIsCommandPaletteOpen((open) => !open)
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
    },
    [],
  )

  useHotkeys(
    ['meta+,', 'ctrl+,'],
    (event) => {
      event.preventDefault()
      triggerRouteProgressStart()
      router.push('/app/settings')
      setIsCommandPaletteOpen(false)
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
    },
    [router],
  )

  return (
    <HotkeysProvider>
      <TooltipProvider>
        <div className="contents">
          <RouteTransitionProgress
            pathname={pathname}
            searchParamsString={searchParamsString}
          />
          <SidebarProvider>
            <Sidebar variant="floating">
              <SidebarHeader className="border-sidebar-border gap-3 border-b px-2 py-3">
                <Link
                  className="text-sidebar-foreground hover:text-sidebar-accent-foreground px-2 font-semibold tracking-tight"
                  href="/app"
                >
                  Next Vibe App Starter
                </Link>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>App</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navItems.map(({ href, label, icon: Icon }) => {
                        const active = activeNavHref === href

                        return (
                          <SidebarMenuItem key={label}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={label}
                            >
                              <Link href={href}>
                                <Icon aria-hidden />
                                <span>{label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter className="border-sidebar-border border-t p-2">
                <UserMenu
                  currentTheme={appearance.currentTheme}
                  onThemeChange={onThemeChange}
                />
              </SidebarFooter>
            </Sidebar>
            <SidebarInset>
              <header className="border-border bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-auto h-8 gap-2"
                  onClick={() => {
                    setIsCommandPaletteOpen(true)
                  }}
                >
                  <CommandIcon className="size-4 opacity-70" />
                  <span className="text-muted-foreground text-xs">
                    Search...
                  </span>
                  <CommandShortcut className="tracking-normal">
                    Ctrl/Cmd+K
                  </CommandShortcut>
                </Button>
              </header>
              <ResolvedAppearanceProvider value={resolvedAppearance}>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              </ResolvedAppearanceProvider>
            </SidebarInset>
          </SidebarProvider>
          <AppCommandPalette
            open={isCommandPaletteOpen}
            onOpenChange={setIsCommandPaletteOpen}
            onSignOut={onSignOut}
            onThemeChange={onThemeChange}
          />
        </div>
      </TooltipProvider>
    </HotkeysProvider>
  )
}
