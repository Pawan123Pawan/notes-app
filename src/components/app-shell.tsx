'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboardIcon, NotebookPenIcon, PlusIcon } from 'lucide-react'

import { AppShellDayCounter } from '@/components/app-shell-day-counter'
import { AppShellUserMenu } from '@/components/app-shell-user-menu'
import { RouteTransitionProgress } from '@/components/route-transition-progress'
import { Separator } from '@/components/ui/separator'
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
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

const navItems = [
  {
    href: '/app',
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    isActive: (pathname: string) => pathname === '/app',
  },
  {
    href: '/app/new',
    label: 'New note',
    icon: PlusIcon,
    isActive: (pathname: string) =>
      pathname === '/app/new' || pathname.startsWith('/app/new/'),
  },
  {
    href: '/app/subjects',
    label: 'Subjects',
    icon: NotebookPenIcon,
    isActive: (pathname: string) => pathname.startsWith('/app/subjects'),
  },
] as const

export type AppShellProps = {
  children: React.ReactNode
}

function AppShellChrome({ children }: AppShellProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <>
      <RouteTransitionProgress />
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/app" onClick={() => setOpenMobile(false)}>
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <NotebookPenIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Notes App</span>
                    <span className="text-muted-foreground truncate text-xs">
                      Study workspace
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="absolute top-4 -right-4 z-50 hidden md:block">
            <SidebarTrigger className="size-8 cursor-pointer" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive(pathname)}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <AppShellDayCounter />
          <AppShellUserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 data-vertical:h-4 data-vertical:self-auto"
          />
          <Link
            href="/app"
            onClick={() => setOpenMobile(false)}
            className="truncate text-sm font-medium"
          >
            Notes App
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </>
  )
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAppRoute = pathname === '/app' || pathname.startsWith('/app/')

  if (!isAppRoute) {
    return children
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppShellChrome>{children}</AppShellChrome>
      </SidebarProvider>
    </TooltipProvider>
  )
}
