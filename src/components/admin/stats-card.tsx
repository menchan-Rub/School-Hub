import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-primary/5 to-secondary/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-200">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-zinc-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-200">{value}</div>
        {(description || trend) && (
          <div className="flex items-center text-xs text-zinc-400 mt-1">
            {trend && (
              <span
                className={cn(
                  "mr-1",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 