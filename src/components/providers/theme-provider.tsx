'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

import { useMountEffect } from '@/hooks/use-mount-effect'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  useMountEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const originalConsoleError = console.error
    console.error = (...args: unknown[]) => {
      const message = args
        .map((arg) => (typeof arg === 'string' ? arg : ''))
        .join(' ')
      if (message.includes('Encountered a script tag')) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.error = originalConsoleError
    }
  })

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
