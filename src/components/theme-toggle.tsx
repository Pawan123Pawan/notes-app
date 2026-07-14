'use client'

import { useState } from 'react'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { cn } from '@/lib/utils'

const themes = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
] as const

type ThemeMode = (typeof themes)[number]['value']

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useMountEffect(() => {
    setMounted(true)
  })

  const active =
    themes.find((item) => item.value === theme) ??
    themes.find((item) => item.value === 'system')!
  const ActiveIcon =
    mounted && resolvedTheme === 'dark'
      ? MoonIcon
      : mounted && resolvedTheme === 'light'
        ? SunIcon
        : active.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(className)}
          aria-label="Toggle theme"
        >
          <ActiveIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? (theme ?? 'system') : 'system'}
          onValueChange={(value) => setTheme(value as ThemeMode)}
        >
          {themes.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <item.icon />
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
