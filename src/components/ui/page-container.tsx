import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type PageContainerProps = ComponentProps<'div'>

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 px-4 py-2 sm:gap-8 sm:px-6',
        className,
      )}
      {...props}
    />
  )
}
