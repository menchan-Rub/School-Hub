import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description: string
  status?: boolean
}

export function PageHeader({ title, description, status }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            {title}
          </h2>
          <Badge variant="outline" className="uppercase text-xs">
            Admin
          </Badge>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {status !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>System Status:</span>
          <span className={status ? "text-green-500" : "text-red-500"}>
            {status ? "Operational" : "Issues Detected"}
          </span>
        </div>
      )}
    </div>
  )
}

interface AdminPageHeaderProps {
  title: string
  subtitle: string
  badge: string
  children?: React.ReactNode
}

export function AdminPageHeader({
  title,
  subtitle,
  badge,
  children
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="flex items-center gap-4 mb-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              ユーザーダッシュボード
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            {title}
          </h2>
          <Badge variant="outline" className="uppercase text-xs">
            {badge}
          </Badge>
        </div>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>システム状態:</span>
          <span className="text-green-500">正常稼働中</span>
        </div>
        {children}
      </div>
    </div>
  )
} 