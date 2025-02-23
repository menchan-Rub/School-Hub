"use client"

import { useEffect, useState } from "react"
import { Channel } from "stream-chat"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { NavigationAction } from "./navigation-action"
import { NavigationItem } from "./navigation-item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { UserButton } from "@/components/auth/user-button"
import { mockStreamChat } from "@/lib/mock-data"

export function NavigationSidebar() {
  const params = useParams()
  const [servers, setServers] = useState<Channel[]>([])

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch("/api/servers")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setServers(data)
      } catch (error) {
        console.error("Failed to fetch servers:", error)
        toast.error("サーバー一覧の取得に失敗しました")
        // 開発環境ではモックデータを使用
        if (process.env.NODE_ENV === "development") {
          setServers(mockStreamChat.channels)
        }
      }
    }

    fetchServers()
  }, [])

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3">
      <NavigationAction />
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => {
          // サーバーの一意のIDを確実に取得
          const serverId = server.id || server.cid || `server-${Date.now()}-${Math.random()}`
          return (
            <NavigationItem
              key={serverId}
              id={serverId}
              name={server.data?.name || ""}
              imageUrl={server.data?.image as string || "/placeholder.svg"}
            />
          )
        })}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton />
      </div>
    </div>
  )
} 