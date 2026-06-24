import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  description: ReactNode
  extraAction?: ReactNode
}

export function PageHeader({
  title,
  description,
  extraAction,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </div>
      {extraAction ? extraAction : null}
    </div>
  )
}
