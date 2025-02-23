"use client"

import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string;
  className?: string;
}

export function UserAvatar({ src, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={src || "/placeholder.svg"} />
    </Avatar>
  )
}

