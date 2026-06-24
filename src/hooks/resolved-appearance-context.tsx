'use client'

import * as React from 'react'

import type {
  AppearanceAccentColor,
  AppearanceBaseColor,
  AppearanceTheme,
} from '@/lib/appearance'

export type ResolvedAppearanceState = {
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}

const ResolvedAppearanceContext =
  React.createContext<ResolvedAppearanceState | null>(null)

export function ResolvedAppearanceProvider({
  value,
  children,
}: React.PropsWithChildren<{ value: ResolvedAppearanceState }>) {
  return (
    <ResolvedAppearanceContext.Provider value={value}>
      {children}
    </ResolvedAppearanceContext.Provider>
  )
}

export function useResolvedAppearance() {
  const value = React.useContext(ResolvedAppearanceContext)
  if (!value) {
    throw new Error(
      'useResolvedAppearance must be used within ResolvedAppearanceProvider',
    )
  }
  return value
}
