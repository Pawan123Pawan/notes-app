'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react'

import { ThemeMenuItems } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

function getInitials(name: string | undefined, email: string | undefined) {
  const source = name?.trim() || email?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export function AppShellUserMenu() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { data: session, isPending } = authClient.useSession()

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut()
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      router.push('/login')
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Sign out failed', error, 'Unable to sign out.')
    },
  })

  const user = session?.user
  const displayName = user?.name?.trim() || 'Account'
  const displayEmail = user?.email ?? ''
  const initials = getInitials(user?.name, user?.email)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Account"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isPending || signOutMutation.isPending}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold">
                {isPending ? '…' : initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {isPending ? 'Loading…' : displayName}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {isPending ? ' ' : displayEmail}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg text-xs font-semibold">
                  {initials}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ThemeMenuItems />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={signOutMutation.isPending}
              onSelect={() => signOutMutation.mutate()}
            >
              <LogOutIcon />
              {signOutMutation.isPending ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
