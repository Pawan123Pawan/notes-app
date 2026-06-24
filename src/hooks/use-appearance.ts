'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import * as React from 'react'

import {
  applyAccentColor,
  applyBaseColor,
  type AppearanceAccentColor,
  type AppearanceBaseColor,
  type AppearanceTheme,
} from '@/lib/appearance'
import { useTRPC } from '@/trpc/client'

type AppearanceState = {
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}

const defaultAppearance: AppearanceState = {
  theme: 'system',
  baseColor: 'neutral',
  accentColor: 'blue',
}

type UseAppearanceOptions = {
  currentAppearance?: AppearanceState
}

export function useAppearance({
  currentAppearance = defaultAppearance,
}: UseAppearanceOptions = {}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const applyAppearanceLocally = React.useCallback(
    (appearance: AppearanceState) => {
      setTheme(appearance.theme)
      applyBaseColor(appearance.baseColor)
      applyAccentColor(appearance.accentColor)
    },
    [setTheme],
  )

  const saveAppearance = useMutation(
    trpc.settings.updateAppearance.mutationOptions({
      onMutate: async (variables) => {
        applyAppearanceLocally(variables)

        const appearanceQueryKey = trpc.settings.getAppearance.queryKey()
        await queryClient.cancelQueries({ queryKey: appearanceQueryKey })
        const previousAppearance =
          queryClient.getQueryData<AppearanceState>(appearanceQueryKey)
        queryClient.setQueryData(appearanceQueryKey, variables)

        return { appearanceQueryKey, previousAppearance }
      },
      onSuccess: (data) => {
        queryClient.setQueryData(trpc.settings.getAppearance.queryKey(), data)
        router.refresh()
      },
      onError: (_error, _variables, context) => {
        if (context?.previousAppearance) {
          applyAppearanceLocally(context.previousAppearance)
          if (context.appearanceQueryKey) {
            queryClient.setQueryData(
              context.appearanceQueryKey,
              context.previousAppearance,
            )
          }
        }
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(
          trpc.settings.getAppearance.queryFilter(),
        )
      },
    }),
  )

  const updateAppearance = React.useCallback(
    (partial: Partial<AppearanceState>) => {
      const nextAppearance: AppearanceState = {
        theme: partial.theme ?? currentAppearance.theme,
        baseColor: partial.baseColor ?? currentAppearance.baseColor,
        accentColor: partial.accentColor ?? currentAppearance.accentColor,
      }
      applyAppearanceLocally(nextAppearance)
    },
    [applyAppearanceLocally, currentAppearance],
  )

  const updateAppearanceAsync = React.useCallback(
    async (partial: Partial<AppearanceState>) => {
      const nextAppearance: AppearanceState = {
        theme: partial.theme ?? currentAppearance.theme,
        baseColor: partial.baseColor ?? currentAppearance.baseColor,
        accentColor: partial.accentColor ?? currentAppearance.accentColor,
      }
      return saveAppearance.mutateAsync(nextAppearance)
    },
    [currentAppearance, saveAppearance],
  )

  return {
    currentTheme:
      (theme as AppearanceTheme | undefined) ?? currentAppearance.theme,
    applyAppearanceLocally,
    updateAppearance,
    updateAppearanceAsync,
    updateTheme: (nextTheme: AppearanceTheme) =>
      updateAppearanceAsync({ theme: nextTheme }),
    updateBaseColor: (baseColor: AppearanceBaseColor) =>
      updateAppearanceAsync({ baseColor }),
    updateAccentColor: (accentColor: AppearanceAccentColor) =>
      updateAppearanceAsync({ accentColor }),
    saveAppearance,
  }
}

export const useApperance = useAppearance
