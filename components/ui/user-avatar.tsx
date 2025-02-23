import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User } from "@/lib/types"

interface UserAvatarProps {
  user: User
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={user.image || ''} alt={user.name} />
      <AvatarFallback>
        {user.name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}