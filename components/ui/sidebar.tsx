"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// SidebarMenuSkeletonのCSS型定義を修正
interface SidebarMenuSkeletonStyles extends React.CSSProperties {
  "--skeleton-width": string
}

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  const styles: SidebarMenuSkeletonStyles = {
    "--skeleton-width": width,
  }

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      style={styles}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton className="h-4 flex-1 max-w-[--skeleton-width]" data-sidebar="menu-skeleton-text" />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

