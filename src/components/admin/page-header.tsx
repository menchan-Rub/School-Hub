interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  children?: React.ReactNode
}

export function AdminPageHeader({
  title,
  subtitle,
  badge,
  children
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {children}
      </div>
    </div>
  )
} 