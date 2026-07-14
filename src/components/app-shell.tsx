'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { LayoutDashboardIcon, NotebookPenIcon, PlusIcon } from 'lucide-react'

import { AppShellUserMenu } from '@/components/app-shell-user-menu'
import { RouteTransitionProgress } from '@/components/route-transition-progress'
import { useRouteTransitionProgress } from '@/hooks/use-route-transition-progress'
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

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAppRoute = pathname === '/app' || pathname.startsWith('/app/')

  if (!isAppRoute) {
    return children
  }

  return <AppShellChrome>{children}</AppShellChrome>
}

function AppShellRouteSync() {
  useRouteTransitionProgress()
  return null
}

function AppShellChrome({ children }: AppShellProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Suspense fallback={null}>
          <AppShellRouteSync />
        </Suspense>
        <RouteTransitionProgress />
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/app">
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
            <div className="absolute top-4 -right-4 z-50">
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
                        <Link href={item.href}>
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
            <AppShellUserMenu />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="min-h-0">
          {/* <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
          </header> */}
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
