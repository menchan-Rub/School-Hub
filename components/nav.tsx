import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { NotificationBadge } from "@/components/ui/notification-badge"

export function Nav() {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements/unread/count')
      if (!res.ok) throw new Error('Failed to fetch unread count')
      return res.json()
    },
    refetchInterval: 30000 // 30秒ごとに更新
  })

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            ダッシュボード
          </Link>
          <Link
            href="/announcements"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            <NotificationBadge count={unreadCount} />
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </div>
  )
} 