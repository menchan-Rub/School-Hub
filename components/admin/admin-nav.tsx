"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  LayoutDashboard, Users, Server, MessageSquare,
  Bell, Ban, History, Settings, Shield
} from "lucide-react"

const adminRoutes = [
  {
    label: 'ダッシュボード',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    label: 'ユーザー管理',
    href: '/admin/users',
    icon: Users
  },
  {
    label: 'サーバー管理',
    href: '/admin/servers',
    icon: Server
  },
  {
    label: 'メッセージ管理',
    href: '/admin/messages',
    icon: MessageSquare
  },
  {
    label: 'お知らせ管理',
    href: '/admin/announcements',
    icon: Bell
  },
  {
    label: 'BAN管理',
    href: '/admin/bans',
    icon: Ban
  },
  {
    label: '監査ログ',
    href: '/admin/audit-logs',
    icon: History
  },
  {
    label: '権限管理',
    href: '/admin/roles',
    icon: Shield
  },
  {
    label: 'セキュリティ設定',
    href: '/admin/security',
    icon: Settings
  }
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-2">
      {adminRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
        >
          <Button
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              pathname === route.href && "bg-muted"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Button>
        </Link>
      ))}
    </nav>
  )
} 