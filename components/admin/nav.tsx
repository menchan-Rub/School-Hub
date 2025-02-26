"use client"

import { cn } from "@/lib/utils"
import { useNavigationStore } from "@/lib/stores/navigation-store"
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  Shield, 
  Settings,
  MessageSquare,
  Bell,
  History,
  Ban
} from "lucide-react"

export function AdminNav() {
  const { activeView, setActiveView } = useNavigationStore()

  const routes = [
    {
      label: "概要",
      icon: LayoutDashboard,
      view: "admin-overview",
    },
    {
      label: "ユーザー",
      icon: Users,
      view: "admin-users",
    },
    {
      label: "サーバー",
      icon: Server,
      view: "admin-servers",
    },
    {
      label: "メッセージ",
      icon: MessageSquare,
      view: "admin-messages",
    },
    {
      label: "お知らせ",
      icon: Bell,
      view: "admin-announcements",
    },
    {
      label: "セキュリティ",
      icon: Shield,
      view: "admin-security",
    },
    {
      label: "監査ログ",
      icon: History,
      view: "admin-audit-logs",
    },
    {
      label: "BAN",
      icon: Ban,
      view: "admin-bans",
    },
    {
      label: "設定",
      icon: Settings,
      view: "admin-settings",
    }
  ]

  return (
    <aside className="w-64 min-h-screen border-r border-[#1e2028]">
      <div className="p-4 border-b border-[#1e2028]">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">System management</p>
      </div>
      <nav className="p-2">
        {routes.map((route) => (
          <button
            key={route.view}
            onClick={() => setActiveView(route.view)}
            className={cn(
              "w-full flex items-center gap-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-md",
              activeView === route.view 
                ? "bg-[#1e2028] text-primary" 
                : "hover:bg-[#1e2028]/50 text-muted-foreground"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </button>
        ))}
      </nav>
    </aside>
  )
} 