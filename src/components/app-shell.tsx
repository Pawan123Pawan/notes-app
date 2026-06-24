'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  ChevronDown,
  CommandIcon,
  LayoutDashboard,
  Users,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { DropdownMenu } from 'radix-ui'
import { HotkeysProvider, useHotkeys } from 'react-hotkeys-hook'
import * as z from 'zod'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
import { showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useApperance } from '@/hooks/use-appearance'

const ROUTE_PROGRESS_START_EVENT = 'app-route-progress-start'

function triggerRouteProgressStart() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(ROUTE_PROGRESS_START_EVENT))
}

type NavItemRouteParams = {
  workspaceSlug: string
}

type NavItem = {
  href: string | ((params: NavItemRouteParams) => string)
  label: string
  icon: React.ComponentType<{ 'aria-hidden'?: boolean }>
}

type NavItemGroup = {
  label: string
  items: NavItem[]
}

const workspaceSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters'),
  workspaceSlug: z
    .string()
    .trim()
    .min(2, 'Workspace URL must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
})

type WorkspaceFormValues = z.infer<typeof workspaceSchema>

type WorkspaceSummary = {
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
}

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getNavMatchScore(pathname: string, href: string): number {
  if (pathname === href) {
    return href.length + 1000
  }

  if (pathname.startsWith(`${href}/`)) {
    return href.length
  }

  return -1
}

const navItemGroups = [
  {
    label: 'Workspace',
    items: [
      {
        href: ({ workspaceSlug }) => `/app/${workspaceSlug}`,
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        href: ({ workspaceSlug }) => `/app/${workspaceSlug}/members`,
        label: 'Members',
        icon: Users,
      },
    ],
  },
  {
    label: 'Notifications',
    items: [
      {
        href: ({ workspaceSlug }) => `/app/${workspaceSlug}/notifications`,
        label: 'Notifications',
        icon: Bell,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        href: ({ workspaceSlug }) => `/app/${workspaceSlug}/settings`,
        label: 'Settings',
        icon: Settings,
      },
    ],
  },
] satisfies NavItemGroup[]

function AppCommandPalette({
  open,
  onOpenChange,
  onSignOut,
  workspaceSlug,
  onThemeChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignOut: () => Promise<void>
  workspaceSlug: string
  onThemeChange: (theme: AppearanceTheme) => void
}) {
  const trpc = useTRPC()
  const router = useRouter()
  const workspacesQuery = useQuery(trpc.workspaces.list.queryOptions())
  const switchWorkspace = useMutation({
    mutationFn: async (workspace: WorkspaceSummary) => {
      const { error } = await authClient.organization.setActive({
        organizationId: workspace.workspaceId,
      })

      if (error) {
        throw new Error(error.message ?? 'Could not switch workspace.')
      }

      return workspace.workspaceSlug
    },
    onSuccess: (nextWorkspaceSlug) => {
      triggerRouteProgressStart()
      router.push(`/app/${nextWorkspaceSlug}`)
      router.refresh()
      onOpenChange(false)
    },
    onError: (error) => {
      showErrorToast('Could not switch workspace.', error)
    },
  })

  const goToSettings = () => {
    triggerRouteProgressStart()
    router.push(`/app/${workspaceSlug}/settings`)
    onOpenChange(false)
  }
  const goToAppearanceSettings = () => {
    triggerRouteProgressStart()
    router.push(`/app/${workspaceSlug}/settings?tab=appearance`)
    onOpenChange(false)
  }
  const goToWorkspaceMembers = () => {
    triggerRouteProgressStart()
    router.push(`/app/${workspaceSlug}/members`)
    onOpenChange(false)
  }
  const goToWorkspaceInvitations = () => {
    triggerRouteProgressStart()
    router.push(`/app/${workspaceSlug}/members?tab=invitations`)
    onOpenChange(false)
  }
  const switchToWorkspace = (workspace: WorkspaceSummary) => {
    if (workspace.workspaceSlug === workspaceSlug) {
      return
    }

    switchWorkspace.mutate(workspace)
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
          <CommandGroup heading="Workspace">
            <CommandItem onSelect={goToWorkspaceMembers}>
              <Users className="size-4 opacity-70" />
              View members
            </CommandItem>
            <CommandItem onSelect={goToWorkspaceInvitations}>
              <Plus className="size-4 opacity-70" />
              Invite members
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Switch workspace">
            {workspacesQuery.data
              ?.filter((workspace) => workspace.workspaceSlug !== workspaceSlug)
              .map((workspace) => (
                <CommandItem
                  key={workspace.workspaceId}
                  onSelect={() => {
                    switchToWorkspace(workspace)
                  }}
                  disabled={switchWorkspace.isPending}
                >
                  <LayoutDashboard className="size-4 opacity-70" />
                  Switch to {workspace.workspaceName}
                </CommandItem>
              ))}
          </CommandGroup>
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

function WorkspaceSwitcher({
  activeWorkspaceSlug,
}: {
  activeWorkspaceSlug?: string
}) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      workspaceName: '',
      workspaceSlug: '',
    },
  })

  const workspacesQuery = useQuery(trpc.workspaces.list.queryOptions())
  const switchWorkspace = useMutation({
    mutationFn: async (workspace: WorkspaceSummary) => {
      const { error } = await authClient.organization.setActive({
        organizationId: workspace.workspaceId,
      })

      if (error) {
        throw new Error(error.message ?? 'Could not switch workspace.')
      }

      return workspace.workspaceSlug
    },
    onSuccess: (workspaceSlug) => {
      triggerRouteProgressStart()
      router.push(`/app/${workspaceSlug}`)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not switch workspace.', error)
    },
  })

  const createWorkspace = useMutation({
    mutationFn: async (values: WorkspaceFormValues) => {
      const { data, error } = await authClient.organization.create({
        name: values.workspaceName,
        slug: values.workspaceSlug,
      })

      if (error) {
        throw new Error(error.message ?? 'Could not create workspace.')
      }

      const workspaceId = data?.id
      if (!workspaceId) {
        throw new Error(
          'Workspace was created, but no workspace id was returned.',
        )
      }

      const { error: setActiveError } = await authClient.organization.setActive(
        {
          organizationId: workspaceId,
        },
      )

      if (setActiveError) {
        throw new Error(
          setActiveError.message ?? 'Could not activate workspace.',
        )
      }

      return data?.slug || values.workspaceSlug
    },
    onSuccess: async (workspaceSlug) => {
      await queryClient.invalidateQueries(trpc.workspaces.list.queryFilter())
      reset()
      setIsCreateDialogOpen(false)
      triggerRouteProgressStart()
      router.push(`/app/${workspaceSlug}`)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast(
        'Something went wrong while creating your workspace.',
        error,
      )
    },
  })

  const workspaces = workspacesQuery.data ?? []
  const activeWorkspace =
    workspaces.find(
      (workspace) => workspace.workspaceSlug === activeWorkspaceSlug,
    ) ?? workspaces[0]

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            className="h-auto w-full justify-between gap-2 px-2 py-2"
            type="button"
            variant="outline"
            aria-label="Workspace switcher"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start text-left">
              <span className="max-w-full truncate text-sm font-medium">
                {workspacesQuery.isPending
                  ? 'Loading workspaces...'
                  : activeWorkspace?.workspaceName || 'Select workspace'}
              </span>
              <span className="text-muted-foreground max-w-full truncate text-xs">
                {activeWorkspace?.workspaceSlug || 'No active workspace'}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            className="bg-popover text-popover-foreground border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50 min-w-64 overflow-hidden rounded-lg border p-1 shadow-md"
            side="bottom"
            sideOffset={8}
          >
            <DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
              Workspaces
            </DropdownMenu.Label>
            {workspaces.map((workspace) => (
              <DropdownMenu.Item
                key={workspace.workspaceId}
                className="focus:bg-accent focus:text-accent-foreground flex cursor-default flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
                disabled={switchWorkspace.isPending}
                onSelect={(event) => {
                  event.preventDefault()
                  if (
                    workspace.workspaceSlug === activeWorkspace?.workspaceSlug
                  ) {
                    return
                  }

                  switchWorkspace.mutate(workspace)
                }}
              >
                <span className="max-w-full truncate font-medium">
                  {workspace.workspaceName}
                </span>
                <span className="text-muted-foreground max-w-full truncate text-xs">
                  {workspace.workspaceSlug}
                </span>
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="bg-border -mx-1 my-1 h-px" />
            <DropdownMenu.Item
              className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
              disabled={createWorkspace.isPending}
              onSelect={(event) => {
                event.preventDefault()
                createWorkspace.reset()
                setIsCreateDialogOpen(true)
              }}
            >
              <Plus className="size-4 opacity-70" />
              Create workspace
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            createWorkspace.reset()
            reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Set a workspace name and URL slug for your new workspace.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            noValidate
            onSubmit={handleSubmit((values) => {
              createWorkspace.reset()
              createWorkspace.mutate(values)
            })}
          >
            <FieldGroup>
              <Field data-invalid={errors.workspaceName ? 'true' : undefined}>
                <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                <Input
                  id="workspace-name"
                  placeholder="Acme Inc"
                  aria-invalid={!!errors.workspaceName}
                  {...register('workspaceName', {
                    onChange: (event) => {
                      const generatedSlug = toSlug(event.target.value)
                      setValue('workspaceSlug', generatedSlug, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    },
                  })}
                />
                <FieldError errors={[errors.workspaceName]} />
              </Field>
              <Field data-invalid={errors.workspaceSlug ? 'true' : undefined}>
                <FieldLabel htmlFor="workspace-slug">
                  Workspace URL slug
                </FieldLabel>
                <Input
                  id="workspace-slug"
                  placeholder="acme-inc"
                  aria-invalid={!!errors.workspaceSlug}
                  {...register('workspaceSlug')}
                />
                <FieldError errors={[errors.workspaceSlug]} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" loading={createWorkspace.isPending}>
                Create workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (completeTimeoutRef.current) {
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
        if (current >= 90) {
          return current
        }

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

  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        return
      }

      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const link = target.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement)) {
        return
      }

      if (link.target && link.target !== '_self') {
        return
      }

      if (link.hasAttribute('download')) {
        return
      }

      const destination = new URL(link.href, window.location.href)
      if (destination.origin !== window.location.origin) {
        return
      }

      const destinationPath = `${destination.pathname}${destination.search}${destination.hash}`
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

      if (destinationPath === currentPath) {
        return
      }

      startProgress()
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [startProgress])

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
 *
 * This component should only be used in the root layout of authenticated routes (app/layout.tsx).
 * It should not be used inside any nested layouts.
 * It should not be used in the root layout of unauthenticated routes (layout.tsx).
 */
export function AppShell({
  children,
  workspaceSlug,
  workspaceId,
  initialAppearance,
}: React.PropsWithChildren<{
  workspaceSlug: string
  workspaceId: string
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
  const navItemRouteParams = React.useMemo<NavItemRouteParams>(
    () => ({ workspaceSlug }),
    [workspaceSlug],
  )
  const notificationsQuery = useQuery({
    ...trpc.notification.list.queryOptions({ workspaceSlug }),
  })
  const unreadNotificationsCount = React.useMemo(
    () =>
      (notificationsQuery.data ?? []).filter(
        (notification) => !notification?.isRead,
      ).length,
    [notificationsQuery.data],
  )
  const appearanceQuery = useQuery(
    trpc.settings.getAppearance.queryOptions({ workspaceId }),
  )
  const resolvedAppearance = React.useMemo(
    () => appearanceQuery.data ?? initialAppearance,
    [appearanceQuery.data, initialAppearance],
  )
  const appearance = useApperance({
    workspaceId,
    currentAppearance: resolvedAppearance,
    errorMessage: 'Could not update appearance.',
  })

  const activeNavHref = React.useMemo(() => {
    let bestHref: string | null = null
    let bestScore = -1

    for (const group of navItemGroups) {
      for (const item of group.items) {
        const resolvedHref =
          typeof item.href === 'function'
            ? item.href(navItemRouteParams)
            : item.href
        const score = getNavMatchScore(pathname, resolvedHref)

        if (score > bestScore) {
          bestScore = score
          bestHref = resolvedHref
        }
      }
    }

    return bestHref
  }, [navItemRouteParams, pathname])
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false)

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
      router.push(`/app/${workspaceSlug}/settings`)
      setIsCommandPaletteOpen(false)
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
    },
    [router],
  )

  React.useLayoutEffect(
    function syncResolvedAppearance() {
      appearance.applyAppearanceLocally(resolvedAppearance)
    },
    [appearance, resolvedAppearance],
  )

  return (
    <HotkeysProvider>
      <TooltipProvider>
        <div
          data-base-color={resolvedAppearance.baseColor}
          data-accent-color={resolvedAppearance.accentColor}
          className="contents"
        >
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
                  Micro SaaS Starter
                </Link>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <WorkspaceSwitcher activeWorkspaceSlug={workspaceSlug} />
                  </SidebarGroupContent>
                </SidebarGroup>
                {navItemGroups.map((group) => (
                  <SidebarGroup key={group.label}>
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map(({ href, label, icon: Icon }) => {
                          const resolvedHref =
                            typeof href === 'function'
                              ? href(navItemRouteParams)
                              : href
                          const active = activeNavHref === resolvedHref

                          return (
                            <SidebarMenuItem key={label}>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={label}
                              >
                                <Link href={resolvedHref}>
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
                ))}
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
                  size="icon"
                  className="relative ml-auto h-8 w-8"
                  aria-label={`Notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
                  onClick={() => {
                    triggerRouteProgressStart()
                    router.push(`/app/${workspaceSlug}/notifications`)
                  }}
                >
                  <Bell className="size-4" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium">
                      {unreadNotificationsCount > 99
                        ? '99+'
                        : unreadNotificationsCount}
                    </span>
                  ) : null}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 gap-2"
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
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </SidebarInset>
          </SidebarProvider>
          <AppCommandPalette
            open={isCommandPaletteOpen}
            onOpenChange={setIsCommandPaletteOpen}
            onSignOut={onSignOut}
            workspaceSlug={workspaceSlug}
            onThemeChange={onThemeChange}
          />
        </div>
      </TooltipProvider>
    </HotkeysProvider>
  )
}
