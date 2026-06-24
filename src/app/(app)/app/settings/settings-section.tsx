type SettingsSectionProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
