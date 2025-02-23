"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Plus, Settings, Users, Globe, MessageSquare, Bell, Bookmark } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useModal } from "@/lib/hooks/use-modal-store"
import { UserAvatar } from "@/components/user-avatar"

const routes = [
  {
    label: "ホーム",
    icon: Home,
    href: "/",
  },
  {
    label: "フレンド",
    icon: Users,
    href: "/friends",
  },
  {
    label: "メッセージ",
    icon: MessageSquare,
    href: "/messages",
  },
  {
    label: "通知",
    icon: Bell,
    href: "/notifications",
  },
  {
    label: "ブラウザ",
    icon: Globe,
    href: "/browser",
  },
  {
    label: "ブックマーク",
    icon: Bookmark,
    href: "/bookmarks",
  },
]

export function NavigationSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { onOpen } = useModal()

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3">
      <TooltipProvider>
        {routes.map((route) => (
          <Tooltip key={route.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant={pathname === route.href ? "default" : "ghost"}
                className={cn(
                  "group relative flex items-center justify-center w-12 h-12 rounded-[24px]",
                  pathname === route.href && "bg-primary/10",
                )}
                onClick={() => router.push(route.href)}
              >
                <route.icon
                  className={cn("h-5 w-5", pathname === route.href ? "text-primary" : "text-muted-foreground")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{route.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onOpen("createServer")}
              variant="ghost"
              className="group flex items-center justify-center w-12 h-12 rounded-[24px]"
            >
              <Plus className="h-5 w-5 text-emerald-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">サーバーを作成</TooltipContent>
        </Tooltip>
        <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="w-12 h-12 rounded-[24px]" onClick={() => router.push("/settings")}>
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">設定</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-12 h-12 rounded-[24px]"
                onClick={() => router.push(`/profile/${session?.user?.id}`)}
              >
                <UserAvatar src={session?.user?.image} className="h-8 w-8" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">プロフィール</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}

