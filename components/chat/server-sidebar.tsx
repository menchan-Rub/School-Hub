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

export function ServerSidebar() {
  const params = useParams()
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(`/api/servers/${params.serverId}/channels`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setChannels(data)
      } catch (error) {
        console.error("Failed to fetch channels:", error)
        toast.error("チャンネル一覧の取得に失敗しました")
      }
    }

    if (params.serverId) {
      fetchChannels()
    }
  }, [params.serverId])

  return (
    <div className="flex flex-col h-full w-60 bg-[#2B2D31] dark:bg-[#2B2D31]">
      <div className="flex items-center h-12 px-3 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <p className="font-semibold text-md text-white">
          サーバー名
        </p>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <div className="flex items-center justify-between group">
            <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              テキストチャンネル
            </p>
            <button className="h-4 w-4 rounded-sm bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 opacity-0 group-hover:opacity-100 transition">
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => {}}
              className={`group px-2 py-2 rounded-md w-full flex items-center gap-x-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1 ${
                params.channelId === channel.id ? "bg-zinc-700/20 dark:bg-zinc-700" : ""
              }`}
            >
              <Hash className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <p className={`line-clamp-1 font-semibold text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition ${
                params.channelId === channel.id ? "text-white dark:text-white" : ""
              }`}>
                {channel.data?.name || "general"}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto p-3 bg-[#232428]">
        <UserButton />
      </div>
    </div>
  )
}

function Hash({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
} 