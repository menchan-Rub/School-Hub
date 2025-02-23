"use client"

import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"

interface NotificationBadgeProps {
  count?: number
  className?: string
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (!count) {
    return <Bell className={cn("h-5 w-5", className)} />
  }

  return (
    <div className="relative">
      <Bell className={cn("h-5 w-5", className)} />
      <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
        {count > 99 ? "99+" : count}
      </div>
    </div>
  )
} 