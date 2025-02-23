"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Server,
  Settings,
  MessageSquare,
  Bell,
  Shield,
  FileText
} from "lucide-react"

const routes = [
  {
    label: "ダッシュボード",
    icon: LayoutDashboard,
    href: "/admin",
    color: "text-sky-500"
  },
  {
    label: "ユーザー管理",
    icon: Users,
    href: "/admin/users",
    color: "text-violet-500"
  },
  {
    label: "サーバー管理",
    icon: Server,
    href: "/admin/servers",
    color: "text-pink-500"
  },
  {
    label: "メッセージ管理",
    icon: MessageSquare,
    href: "/admin/messages",
    color: "text-orange-500"
  },
  {
    label: "お知らせ管理",
    icon: Bell,
    href: "/admin/announcements",
    color: "text-emerald-500"
  },
  {
    label: "セキュリティ",
    icon: Shield,
    href: "/admin/security",
    color: "text-red-500"
  },
  {
    label: "ログ",
    icon: FileText,
    href: "/admin/logs",
    color: "text-yellow-500"
  },
  {
    label: "設定",
    icon: Settings,
    href: "/admin/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-secondary/10">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">
          管理パネル
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-primary/10 rounded-lg transition",
                pathname === route.href ? "bg-primary/10" : "transparent",
                route.color
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 