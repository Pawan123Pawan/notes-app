export const appearanceThemes = ['system', 'light', 'dark'] as const
export type AppearanceTheme = (typeof appearanceThemes)[number]

export const appearanceBaseColors = [
  'neutral',
  'stone',
  'zinc',
  'mauve',
  'olive',
  'mist',
  'taupe',
] as const
export type AppearanceBaseColor = (typeof appearanceBaseColors)[number]

export const appearanceAccentColors = [
  'slate',
  'blue',
  'green',
  'orange',
  'pink',
] as const
export type AppearanceAccentColor = (typeof appearanceAccentColors)[number]

type AccentPalette = {
  primary: string
  primaryForeground: string
  ring: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
}

type AccentSpec = {
  swatchClassName: string
  light: AccentPalette
  dark: AccentPalette
}

type BaseColorSpec = {
  label: string
  swatchClassName: string
}

export const baseColorSpecs: Record<AppearanceBaseColor, BaseColorSpec> = {
  neutral: {
    label: 'Neutral',
    swatchClassName: 'bg-neutral-500',
  },
  stone: {
    label: 'Stone',
    swatchClassName: 'bg-stone-500',
  },
  zinc: {
    label: 'Zinc',
    swatchClassName: 'bg-zinc-500',
  },
  mauve: {
    label: 'Mauve',
    swatchClassName: 'bg-violet-500',
  },
  olive: {
    label: 'Olive',
    swatchClassName: 'bg-lime-500',
  },
  mist: {
    label: 'Mist',
    swatchClassName: 'bg-sky-400',
  },
  taupe: {
    label: 'Taupe',
    swatchClassName: 'bg-amber-600',
  },
}

export const accentSpecs: Record<AppearanceAccentColor, AccentSpec> = {
  slate: {
    swatchClassName: 'bg-white border border-zinc-300',
    light: {
      primary: 'oklch(0.205 0 0)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.708 0 0)',
      sidebarPrimary: 'oklch(0.205 0 0)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.922 0 0)',
      primaryForeground: 'oklch(0.205 0 0)',
      ring: 'oklch(0.556 0 0)',
      sidebarPrimary: 'oklch(0.488 0.243 264.376)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
    },
  },
  blue: {
    swatchClassName: 'bg-blue-500',
    light: {
      primary: 'oklch(0.55 0.2 256)',
      primaryForeground: 'oklch(0.99 0 0)',
      ring: 'oklch(0.65 0.16 256)',
      sidebarPrimary: 'oklch(0.55 0.2 256)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)',
    },
    dark: {
      primary: 'oklch(0.65 0.19 256)',
      primaryForeground: 'oklch(0.18 0.02 256)',
      ring: 'oklch(0.62 0.19 256)',
      sidebarPrimary: 'oklch(0.62 0.19 256)',
      sidebarPrimaryForeground: 'oklch(0.2 0.02 256)',
    },
  },
  green: {
    swatchClassName: 'bg-emerald-500',
    light: {
      primary: 'oklch(0.62 0.2 150)',
      primaryForeground: 'oklch(0.98 0 0)',
      ring: 'oklch(0.68 0.17 150)',
      sidebarPrimary: 'oklch(0.62 0.2 150)',
      sidebarPrimaryForeground: 'oklch(0.98 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.17 150)',
      primaryForeground: 'oklch(0.2 0.03 150)',
      ring: 'oklch(0.66 0.16 150)',
      sidebarPrimary: 'oklch(0.7 0.17 150)',
      sidebarPrimaryForeground: 'oklch(0.2 0.03 150)',
    },
  },
  orange: {
    swatchClassName: 'bg-orange-500',
    light: {
      primary: 'oklch(0.72 0.19 53)',
      primaryForeground: 'oklch(0.22 0.02 53)',
      ring: 'oklch(0.75 0.16 53)',
      sidebarPrimary: 'oklch(0.72 0.19 53)',
      sidebarPrimaryForeground: 'oklch(0.22 0.02 53)',
    },
    dark: {
      primary: 'oklch(0.76 0.16 53)',
      primaryForeground: 'oklch(0.22 0.02 53)',
      ring: 'oklch(0.72 0.14 53)',
      sidebarPrimary: 'oklch(0.76 0.16 53)',
      sidebarPrimaryForeground: 'oklch(0.22 0.02 53)',
    },
  },
  pink: {
    swatchClassName: 'bg-pink-500',
    light: {
      primary: 'oklch(0.67 0.24 355)',
      primaryForeground: 'oklch(0.99 0 0)',
      ring: 'oklch(0.72 0.2 355)',
      sidebarPrimary: 'oklch(0.67 0.24 355)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)',
    },
    dark: {
      primary: 'oklch(0.73 0.21 355)',
      primaryForeground: 'oklch(0.2 0.03 355)',
      ring: 'oklch(0.67 0.2 355)',
      sidebarPrimary: 'oklch(0.73 0.21 355)',
      sidebarPrimaryForeground: 'oklch(0.2 0.03 355)',
    },
  },
}

export function applyAccentColor(accentColor: AppearanceAccentColor) {
  if (typeof document === 'undefined') {
    return
  }

  document.body.dataset.accentColor = accentColor
}

export function applyBaseColor(baseColor: AppearanceBaseColor) {
  if (typeof document === 'undefined') {
    return
  }

  document.body.dataset.baseColor = baseColor
}
