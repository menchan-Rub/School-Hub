"use client"

import { useEffect, useState } from "react"
import { Channel } from "stream-chat"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ChatSidebar() {
  const [channels, setChannels] = useState<Channel[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch("/api/channels")
        if (!response.ok) throw new Error("Failed to fetch channels")
        const data = await response.json()
        setChannels(data)
      } catch (error) {
        console.error("Error fetching channels:", error)
      }
    }

    fetchChannels()
  }, [])

  return (
    <div className="w-60 bg-[#1E1F22] flex flex-col h-full">
      <div className="p-3 flex justify-between items-center border-b border-gray-800">
        <h2 className="text-white font-semibold">チャンネル</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => router.push(`/chat/${channel.id}`)}
              className="w-full p-2 flex items-center space-x-2 rounded hover:bg-gray-800 transition"
            >
              <Avatar
                src={channel.data?.image || "/placeholder.svg"}
                alt={channel.data?.name || "Channel"}
                className="h-8 w-8"
              />
              <span className="text-sm text-gray-300 truncate">
                {channel.data?.name || "Untitled Channel"}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 