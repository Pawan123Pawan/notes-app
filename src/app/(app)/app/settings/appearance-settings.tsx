'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'

import { SettingsSection } from './settings-section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn, getErrorMessage } from '@/lib/utils'
import {
  accentSpecs,
  type AppearanceAccentColor,
  type AppearanceBaseColor,
  type AppearanceTheme,
  baseColorSpecs,
} from '@/lib/appearance'
import { toast } from 'sonner'
import { useResolvedAppearance } from '@/hooks/resolved-appearance-context'
import { useAppearance } from '@/hooks/use-appearance'

const themeOptions: Array<{
  value: AppearanceTheme
  label: string
  Icon: typeof Monitor
}> = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

export function AppearanceSettings() {
  const resolvedAppearance = useResolvedAppearance()

  const appearance = useAppearance({
    currentAppearance: resolvedAppearance,
  })

  const updateAppearance = (
    partial: Partial<{
      theme: AppearanceTheme
      baseColor: AppearanceBaseColor
      accentColor: AppearanceAccentColor
    }>,
  ) => {
    toast.promise(appearance.updateAppearanceAsync(partial), {
      loading: 'Applying appearance settings...',
      success: 'Appearance updated.',
      error: (err) =>
        getErrorMessage(err, 'Could not update appearance settings.'),
    })
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
                const isActive = resolvedAppearance.theme === value
                return (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      'border-border bg-background hover:border-foreground/40 flex items-center justify-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition',
                      isActive && 'ring-ring ring-1',
                    )}
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
                  const isActive = resolvedAppearance.baseColor === baseColor
                  return (
                    <button
                      key={baseColor}
                      type="button"
                      className={cn(
                        'border-border bg-background hover:border-foreground/40 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition',
                        isActive && 'ring-ring ring-1',
                      )}
                      onClick={() => {
                        updateAppearance({ baseColor })
                      }}
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
                  const isActive =
                    resolvedAppearance.accentColor === accentColor
                  return (
                    <button
                      key={accentColor}
                      type="button"
                      className={cn(
                        'hover:border-foreground/40 relative flex size-11 items-center justify-center rounded-full border-2 border-transparent transition',
                        isActive && 'border-foreground/40',
                      )}
                      onClick={() => {
                        updateAppearance({ accentColor })
                      }}
                      aria-label={`Select ${accentColor} accent color`}
                    >
                      <span
                        className={cn(
                          'flex size-9 items-center justify-center rounded-full',
                          accentSpecs[accentColor].swatchClassName,
                        )}
                      >
                        <Check
                          className={cn(
                            'size-4',
                            isActive ? 'opacity-100' : 'opacity-0',
                            accentColor === 'slate'
                              ? 'text-black'
                              : 'text-white',
                          )}
                        />
                      </span>
                    </button>
                  )
                },
              )}
            </div>
          </CardContent>
        </Card>
      </SettingsSection>
    </div>
  )
}
