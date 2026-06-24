import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type PageContainerProps = ComponentProps<'div'>

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 p-4 sm:gap-8 sm:p-6', className)}
      {...props}
    />
  )
}
