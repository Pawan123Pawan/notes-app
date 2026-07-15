'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// next-themes injects an inline <script> to apply the theme before paint (no FOUC).
// React 19 warns about <script> inside client components; that warning is a false
// positive here — the script is emitted during SSR and runs on first HTML parse.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
