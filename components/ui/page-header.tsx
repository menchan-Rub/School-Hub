interface PageHeaderProps {
  title: string
  description: string
  status?: boolean
}

export function PageHeader({ title, description, status }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {status && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">All systems normal</span>
        </div>
      )}
    </div>
  )
} 