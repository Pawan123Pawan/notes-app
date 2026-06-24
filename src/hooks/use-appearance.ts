'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

import {
  applyAccentColor,
  applyBaseColor,
  type AppearanceAccentColor,
  type AppearanceBaseColor,
  type AppearanceTheme,
} from '@/lib/appearance'
import { showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

type AppearanceState = {
  theme: AppearanceTheme
  baseColor: AppearanceBaseColor
  accentColor: AppearanceAccentColor
}

type UseApperanceOptions = {
  workspaceId?: string
  currentAppearance: AppearanceState
  errorMessage: string
}

export function useApperance({
  workspaceId,
  currentAppearance,
  errorMessage,
}: UseApperanceOptions) {
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

        if (!workspaceId) {
          return { previousAppearance: null as AppearanceState | null }
        }

        const appearanceQueryKey = trpc.settings.getAppearance.queryKey({
          workspaceId,
        })
        await queryClient.cancelQueries({ queryKey: appearanceQueryKey })
        const previousAppearance =
          queryClient.getQueryData<AppearanceState>(appearanceQueryKey)
        queryClient.setQueryData(appearanceQueryKey, variables)

        return { appearanceQueryKey, previousAppearance }
      },
      onSuccess: (data) => {
        if (!workspaceId) {
          return
        }

        queryClient.setQueryData(
          trpc.settings.getAppearance.queryKey({ workspaceId }),
          data,
        )

        router.refresh()
      },
      onError: (error, _variables, context) => {
        if (context?.previousAppearance) {
          applyAppearanceLocally(context.previousAppearance)
          if (context.appearanceQueryKey) {
            queryClient.setQueryData(
              context.appearanceQueryKey,
              context.previousAppearance,
            )
          }
        }
        showErrorToast(errorMessage, error)
      },
      onSettled: async () => {
        if (!workspaceId) {
          return
        }

        await queryClient.invalidateQueries(
          trpc.settings.getAppearance.queryFilter({ workspaceId }),
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
      if (!workspaceId) {
        applyAppearanceLocally(nextAppearance)
        return
      }
      saveAppearance.mutate({
        workspaceId,
        ...nextAppearance,
      })
    },
    [applyAppearanceLocally, currentAppearance, saveAppearance, workspaceId],
  )

  const updateAppearanceAsync = React.useCallback(
    async (partial: Partial<AppearanceState>) => {
      const nextAppearance: AppearanceState = {
        theme: partial.theme ?? currentAppearance.theme,
        baseColor: partial.baseColor ?? currentAppearance.baseColor,
        accentColor: partial.accentColor ?? currentAppearance.accentColor,
      }
      if (!workspaceId) {
        applyAppearanceLocally(nextAppearance)
        return nextAppearance
      }
      return saveAppearance.mutateAsync({
        workspaceId,
        ...nextAppearance,
      })
    },
    [applyAppearanceLocally, currentAppearance, saveAppearance, workspaceId],
  )

  return {
    currentTheme:
      (theme as AppearanceTheme | undefined) ?? currentAppearance.theme,
    applyAppearanceLocally,
    saveAppearance,
    updateAppearance,
    updateAppearanceAsync,
    updateTheme: (nextTheme: AppearanceTheme) =>
      updateAppearance({ theme: nextTheme }),
    updateBaseColor: (baseColor: AppearanceBaseColor) =>
      updateAppearance({ baseColor }),
    updateAccentColor: (accentColor: AppearanceAccentColor) =>
      updateAppearance({ accentColor }),
  }
}

export const useAppearance = useApperance
