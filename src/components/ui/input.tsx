'use client'

import * as React from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  const isPasswordInput = type === 'password'
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const inputType = isPasswordInput && isPasswordVisible ? 'text' : type

  if (!isPasswordInput) {
    return (
      <input
        type={inputType}
        data-slot="input"
        className={cn(
          'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
          className,
        )}
        {...props}
      />
    )
  }

  return (
    <div className="relative">
      <input
        type={inputType}
        data-slot="input"
        className={cn(
          'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 pr-10 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
          className,
        )}
        {...props}
      />
      <Toggle
        type="button"
        size="sm"
        variant="default"
        pressed={isPasswordVisible}
        onPressedChange={setIsPasswordVisible}
        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-1.5 h-6 w-6 -translate-y-1/2 p-0"
      >
        {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
      </Toggle>
    </div>
  )
}

export { Input }
