"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  count?: number
}

export function MessageSkeleton({ className, count = 3 }: SkeletonProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            "flex items-start space-x-4 p-4",
            className
          )}
        >
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-[20%] bg-muted animate-pulse rounded" />
            <div className="h-4 w-[40%] bg-muted animate-pulse rounded" />
          </div>
        </motion.div>
      ))}
    </>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="space-y-3">
        <div className="h-4 w-[40%] bg-muted animate-pulse rounded" />
        <div className="h-4 w-[80%] bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
} 