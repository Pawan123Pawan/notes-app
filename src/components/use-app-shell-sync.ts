'use client'

import { useLayoutEffect } from 'react'

import { useAppearance } from '@/hooks/use-appearance'
import type {
  AppearanceAccentColor,
  AppearanceBaseColor,
  AppearanceTheme,
} from '@/lib/appearance'

export function useSyncResolvedAppearance(
  appearance: ReturnType<typeof useAppearance>,
  resolvedAppearance: {
    theme: AppearanceTheme
    baseColor: AppearanceBaseColor
    accentColor: AppearanceAccentColor
  },
) {
  useLayoutEffect(
    function syncResolvedAppearance() {
      appearance.applyAppearanceLocally(resolvedAppearance)
    },
    [appearance, resolvedAppearance],
  )
}
