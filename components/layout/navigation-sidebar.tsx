"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Settings, Users, Globe, MessageSquare, Bell, Bookmark, Shield } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNavigationStore, NavigationView } from "@/lib/stores/navigation-store"

export function NavigationSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { activeView, setActiveView } = useNavigationStore()

  // 基本ルート（全ユーザーに表示）
  const baseRoutes = [
    {
      label: "ホーム",
      icon: Home,
      view: "dashboard" as NavigationView,
    },
    {
      label: "フレンド",
      icon: Users,
      view: "friends" as NavigationView,
    },
    {
      label: "メッセージ",
      icon: MessageSquare,
      view: "chat" as NavigationView,
    },
    {
      label: "通知",
      icon: Bell,
      view: "notifications" as NavigationView,
    },
  ]

  // ブラウザ関連のルート
  const browserRoutes = [
    {
      label: "ブラウザ",
      icon: Globe,
      view: "browser" as NavigationView,
    },
    {
      label: "ブックマーク",
      icon: Bookmark,
      view: "bookmarks" as NavigationView,
    },
  ]

  // 管理者専用ルート
  const adminRoutes = session?.user?.role === "super_admin" || session?.user?.role === "admin" ? [
    {
      label: "管理者",
      icon: Shield,
      view: "admin-overview" as NavigationView,
    }
  ] : []

  // すべてのルートを結合
  const routes = [...baseRoutes, ...browserRoutes, ...adminRoutes]

  const handleNavigation = (view: NavigationView) => {
    console.log("Switching to view:", view)
    setActiveView(view)
  }

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3">
      <TooltipProvider>
        <div className="space-y-2">
          {routes.map((route) => (
            <div key={route.view} className="mb-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleNavigation(route.view)}
                    size="icon"
                    variant={activeView === route.view ? "default" : "ghost"}
                    className="h-[48px] w-[48px]"
                  >
                    <route.icon className={cn(
                      "h-5 w-5",
                      activeView === route.view ? "text-white" : "text-zinc-500"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-semibold">{route.label}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}

