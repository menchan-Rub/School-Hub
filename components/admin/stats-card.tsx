import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  description: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  description,
  trend
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
          )}
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
} 