'use client'

import { useQuery } from '@tanstack/react-query'
import { Check, Monitor, Moon, Sun } from 'lucide-react'

import { SettingsSection } from './settings-section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  accentSpecs,
  type AppearanceAccentColor,
  type AppearanceBaseColor,
  type AppearanceTheme,
  baseColorSpecs,
} from '@/lib/appearance'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { useApperance } from '@/hooks/use-appearance'

const themeOptions: Array<{
  value: AppearanceTheme
  label: string
  Icon: typeof Monitor
}> = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

type AppearanceSettingsProps = {
  workspaceId: string
}

export function AppearanceSettings({ workspaceId }: AppearanceSettingsProps) {
  const trpc = useTRPC()
  const appearanceQuery = useQuery(
    trpc.settings.getAppearance.queryOptions({ workspaceId }),
  )

  const persistedTheme = appearanceQuery.data?.theme ?? 'system'
  const persistedBaseColor = appearanceQuery.data?.baseColor ?? 'neutral'
  const persistedAccentColor = appearanceQuery.data?.accentColor ?? 'blue'
  const selectedTheme = persistedTheme
  const selectedBaseColor = persistedBaseColor
  const selectedAccentColor = persistedAccentColor

  const appearance = useApperance({
    workspaceId,
    currentAppearance: {
      theme: selectedTheme,
      baseColor: selectedBaseColor,
      accentColor: selectedAccentColor,
    },
    errorMessage: 'Could not save appearance settings.',
  })

  const updateAppearance = (
    partial: Partial<{
      theme: AppearanceTheme
      baseColor: AppearanceBaseColor
      accentColor: AppearanceAccentColor
    }>,
  ) => {
    const nextTheme = partial.theme ?? selectedTheme
    const nextBaseColor = partial.baseColor ?? selectedBaseColor
    const nextAccentColor = partial.accentColor ?? selectedAccentColor

    toast.promise(
      appearance.updateAppearanceAsync({
        theme: nextTheme,
        baseColor: nextBaseColor,
        accentColor: nextAccentColor,
      }),
      {
        loading: 'Saving appearance settings...',
        success: 'Appearance settings saved successfully.',
        error: 'Could not save appearance settings.',
      },
    )
  }

  if (appearanceQuery.isPending) {
    return (
      <p className="text-muted-foreground text-sm">
        Loading appearance settings…
      </p>
    )
  }

  if (appearanceQuery.isError) {
    return (
      <p className="text-destructive text-sm">
        {appearanceQuery.error instanceof Error
          ? appearanceQuery.error.message
          : 'Could not load appearance settings.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <SettingsSection
        title="Appearance"
        description="Customize how the app looks and feels."
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Select your preferred color theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map(({ value, label, Icon }) => {
                const isActive = selectedTheme === value
                return (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      'border-border bg-background hover:border-foreground/40 flex items-center justify-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition',
                      isActive && 'ring-ring ring-1',
                      appearance.saveAppearance.isPending && 'opacity-50',
                    )}
                    disabled={appearance.saveAppearance.isPending}
                    onClick={() => {
                      updateAppearance({ theme: value })
                    }}
                    aria-label={`Select ${label} theme`}
                  >
                    <Icon className="size-4 opacity-80" />
                    {label}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Base color"
        description="Choose your base UI palette."
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Base color</CardTitle>
            <CardDescription>
              Select a neutral palette for surfaces and typography.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(baseColorSpecs) as AppearanceBaseColor[]).map(
                (baseColor) => {
                  const isActive = selectedBaseColor === baseColor
                  return (
                    <button
                      key={baseColor}
                      type="button"
                      className={cn(
                        'border-border bg-background hover:border-foreground/40 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition',
                        isActive && 'ring-ring ring-1',
                        appearance.saveAppearance.isPending && 'opacity-50',
                      )}
                      onClick={() => {
                        updateAppearance({ baseColor })
                      }}
                      disabled={appearance.saveAppearance.isPending}
                      aria-label={`Select ${baseColor} base color`}
                    >
                      <span>{baseColorSpecs[baseColor].label}</span>
                      <span
                        className={cn(
                          'inline-flex size-4 rounded-full border border-black/10',
                          baseColorSpecs[baseColor].swatchClassName,
                        )}
                      />
                    </button>
                  )
                },
              )}
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Accent color"
        description="Choose an accent color for buttons and interactive elements."
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Accent color</CardTitle>
            <CardDescription>
              Choose an accent color for buttons and interactive elements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(accentSpecs) as AppearanceAccentColor[]).map(
                (accentColor) => {
                  const isActive = selectedAccentColor === accentColor
                  return (
                    <button
                      key={accentColor}
                      type="button"
                      className={cn(
                        'relative flex size-11 items-center justify-center rounded-full border-2 transition',
                        appearance.saveAppearance.isPending && 'opacity-50',
                        isActive
                          ? 'border-foreground'
                          : 'hover:border-foreground/40 border-transparent',
                      )}
                      onClick={() => {
                        updateAppearance({ accentColor })
                      }}
                      aria-label={`Select ${accentColor} accent color`}
                      disabled={appearance.saveAppearance.isPending}
                    >
                      <span
                        className={cn(
                          'flex size-9 items-center justify-center rounded-full',
                          accentSpecs[accentColor].swatchClassName,
                        )}
                      >
                        {isActive ? (
                          <Check
                            className={cn(
                              'size-4',
                              accentColor === 'slate'
                                ? 'text-black'
                                : 'text-white',
                            )}
                          />
                        ) : null}
                      </span>
                    </button>
                  )
                },
              )}
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      {appearance.saveAppearance.isError ? (
        <p className="text-destructive text-sm">
          {appearance.saveAppearance.error instanceof Error
            ? appearance.saveAppearance.error.message
            : 'Could not save appearance settings.'}
        </p>
      ) : null}
    </div>
  )
}
